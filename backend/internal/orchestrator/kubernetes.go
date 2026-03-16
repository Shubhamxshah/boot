package orchestrator

import (
	"context"
	"fmt"

	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

const (
	k8sNamespace     = "infinityos"
	k8sLabelApp      = "app"
	k8sLabelSession  = "infinityos-session-id"
	k8sLabelAppID    = "infinityos-app-id"
	k8sAppValue      = "infinityos-session"
)

// KubernetesOrchestrator launches sessions as Kubernetes Pods.
type KubernetesOrchestrator struct {
	client     kubernetes.Interface
	gpuEnabled bool
}

// NewKubernetesOrchestrator creates a new KubernetesOrchestrator.
func NewKubernetesOrchestrator(kubeconfigPath string, gpuEnabled bool) (*KubernetesOrchestrator, error) {
	cfg, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		// Try in-cluster config
		cfg, err = clientcmd.BuildConfigFromFlags("", "")
		if err != nil {
			return nil, fmt.Errorf("k8s config: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("k8s client: %w", err)
	}

	// Ensure namespace exists
	ctx := context.Background()
	_, err = clientset.CoreV1().Namespaces().Get(ctx, k8sNamespace, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		ns := &corev1.Namespace{
			ObjectMeta: metav1.ObjectMeta{Name: k8sNamespace},
		}
		if _, err := clientset.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{}); err != nil {
			return nil, fmt.Errorf("create namespace: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("get namespace: %w", err)
	}

	return &KubernetesOrchestrator{
		client:     clientset,
		gpuEnabled: gpuEnabled,
	}, nil
}

func (k *KubernetesOrchestrator) Launch(ctx context.Context, cfg SessionConfig) (*SessionInfo, error) {
	podName := fmt.Sprintf("infinityos-%s", cfg.SessionID)

	cpuReq := resource.MustParse(fmt.Sprintf("%dm", int(cfg.CPUCores*1000)))
	memReq := resource.MustParse(fmt.Sprintf("%dGi", cfg.MemoryGB))

	resourceReqs := corev1.ResourceRequirements{
		Requests: corev1.ResourceList{
			corev1.ResourceCPU:    cpuReq,
			corev1.ResourceMemory: memReq,
		},
		Limits: corev1.ResourceList{
			corev1.ResourceCPU:    cpuReq,
			corev1.ResourceMemory: memReq,
		},
	}

	if cfg.GPUEnabled && k.gpuEnabled {
		gpuQ := resource.MustParse("1")
		resourceReqs.Limits["nvidia.com/gpu"] = gpuQ
		resourceReqs.Requests["nvidia.com/gpu"] = gpuQ
	}

	readinessProbe := &corev1.Probe{
		ProbeHandler: corev1.ProbeHandler{
			HTTPGet: &corev1.HTTPGetAction{
				Path: "/",
				Port: intstr.FromInt(6080),
			},
		},
		InitialDelaySeconds: 5,
		PeriodSeconds:       5,
		FailureThreshold:    12,
	}

	var volumes []corev1.Volume
	var volumeMounts []corev1.VolumeMount
	if cfg.UserDataDir != "" {
		volumes = append(volumes, corev1.Volume{
			Name: "userdata",
			VolumeSource: corev1.VolumeSource{
				HostPath: &corev1.HostPathVolumeSource{Path: cfg.UserDataDir},
			},
		})
		volumeMounts = append(volumeMounts, corev1.VolumeMount{
			Name:      "userdata",
			MountPath: "/userdata",
		})
	}

	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      podName,
			Namespace: k8sNamespace,
			Labels: map[string]string{
				k8sLabelApp:     k8sAppValue,
				k8sLabelSession: cfg.SessionID,
				k8sLabelAppID:   cfg.AppID,
			},
		},
		Spec: corev1.PodSpec{
			RestartPolicy: corev1.RestartPolicyNever,
			Volumes:       volumes,
			Containers: []corev1.Container{
				{
					Name:  "session",
					Image: cfg.Image,
					Ports: []corev1.ContainerPort{
						{ContainerPort: 6080, Protocol: corev1.ProtocolTCP},
					},
					Resources:      resourceReqs,
					ReadinessProbe: readinessProbe,
					VolumeMounts:   volumeMounts,
					Env: []corev1.EnvVar{
						{Name: "SESSION_ID", Value: cfg.SessionID},
						{Name: "APP_ID", Value: cfg.AppID},
					},
				},
			},
		},
	}

	createdPod, err := k.client.CoreV1().Pods(k8sNamespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("create pod: %w", err)
	}

	// Create a NodePort service
	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      podName,
			Namespace: k8sNamespace,
			Labels: map[string]string{
				k8sLabelApp:     k8sAppValue,
				k8sLabelSession: cfg.SessionID,
			},
		},
		Spec: corev1.ServiceSpec{
			Type: corev1.ServiceTypeNodePort,
			Selector: map[string]string{
				k8sLabelSession: cfg.SessionID,
			},
			Ports: []corev1.ServicePort{
				{
					Port:       6080,
					TargetPort: intstr.FromInt(6080),
					Protocol:   corev1.ProtocolTCP,
				},
			},
		},
	}

	createdSvc, err := k.client.CoreV1().Services(k8sNamespace).Create(ctx, svc, metav1.CreateOptions{})
	if err != nil {
		// Clean up pod
		_ = k.client.CoreV1().Pods(k8sNamespace).Delete(ctx, podName, metav1.DeleteOptions{})
		return nil, fmt.Errorf("create service: %w", err)
	}

	var nodePort int32
	if len(createdSvc.Spec.Ports) > 0 {
		nodePort = createdSvc.Spec.Ports[0].NodePort
	}

	log.Info().
		Str("pod_name", createdPod.Name).
		Str("session_id", cfg.SessionID).
		Int32("node_port", nodePort).
		Msg("pod created")

	return &SessionInfo{
		PodName: createdPod.Name,
		Port:    int(nodePort),
		VNCUrl:  fmt.Sprintf("http://localhost:%d/vnc.html", nodePort),
	}, nil
}

func (k *KubernetesOrchestrator) Stop(ctx context.Context, sessionID string) error {
	podName := fmt.Sprintf("infinityos-%s", sessionID)

	if err := k.client.CoreV1().Pods(k8sNamespace).Delete(ctx, podName, metav1.DeleteOptions{}); err != nil {
		if !errors.IsNotFound(err) {
			log.Error().Err(err).Str("pod", podName).Msg("failed to delete pod")
		}
	}

	if err := k.client.CoreV1().Services(k8sNamespace).Delete(ctx, podName, metav1.DeleteOptions{}); err != nil {
		if !errors.IsNotFound(err) {
			log.Error().Err(err).Str("service", podName).Msg("failed to delete service")
		}
	}

	return nil
}

func (k *KubernetesOrchestrator) GetStatus(ctx context.Context, sessionID string) (string, error) {
	podName := fmt.Sprintf("infinityos-%s", sessionID)
	pod, err := k.client.CoreV1().Pods(k8sNamespace).Get(ctx, podName, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		return "stopped", nil
	}
	if err != nil {
		return "error", err
	}

	switch pod.Status.Phase {
	case corev1.PodRunning:
		// Check ready condition
		for _, cond := range pod.Status.Conditions {
			if cond.Type == corev1.PodReady && cond.Status == corev1.ConditionTrue {
				return "ready", nil
			}
		}
		return "starting", nil
	case corev1.PodPending:
		return "starting", nil
	case corev1.PodSucceeded:
		return "stopped", nil
	case corev1.PodFailed:
		return "error", nil
	default:
		return "unknown", nil
	}
}

func (k *KubernetesOrchestrator) Reconcile(ctx context.Context) ([]string, error) {
	pods, err := k.client.CoreV1().Pods(k8sNamespace).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=%s", k8sLabelApp, k8sAppValue),
	})
	if err != nil {
		return nil, fmt.Errorf("list pods: %w", err)
	}

	sessionIDs := make([]string, 0, len(pods.Items))
	for _, pod := range pods.Items {
		if sid, ok := pod.Labels[k8sLabelSession]; ok && sid != "" {
			sessionIDs = append(sessionIDs, sid)
		}
	}
	return sessionIDs, nil
}

func (k *KubernetesOrchestrator) HasGPUCapacity(ctx context.Context) bool {
	if !k.gpuEnabled {
		return false
	}
	nodes, err := k.client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return false
	}
	for _, node := range nodes.Items {
		if qty, ok := node.Status.Capacity["nvidia.com/gpu"]; ok {
			if qty.Value() > 0 {
				return true
			}
		}
	}
	return false
}
