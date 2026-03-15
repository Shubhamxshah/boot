package orchestrator

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	dockerclient "github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/infinityos/backend/internal/ports"
	"github.com/rs/zerolog/log"
)

const (
	labelSessionID = "infinityos.session_id"
	labelUserID    = "infinityos.user_id"
	labelAppID     = "infinityos.app_id"
	labelWarm      = "infinityos.warm"
	vncPort        = "6080/tcp"
)

// DockerOrchestrator launches sessions as Docker containers.
type DockerOrchestrator struct {
	client     *dockerclient.Client
	allocator  *ports.Allocator
	gpuEnabled bool
}

// NewDockerOrchestrator creates a new DockerOrchestrator using the Docker daemon
// found via the DOCKER_HOST environment variable (or the default socket).
func NewDockerOrchestrator(gpuEnabled bool) (*DockerOrchestrator, error) {
	cli, err := dockerclient.NewClientWithOpts(
		dockerclient.FromEnv,
		dockerclient.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return nil, fmt.Errorf("docker client: %w", err)
	}
	return &DockerOrchestrator{
		client:     cli,
		allocator:  ports.NewAllocator(),
		gpuEnabled: gpuEnabled,
	}, nil
}

// Launch starts a container for the given session config and returns connection details.
func (d *DockerOrchestrator) Launch(ctx context.Context, cfg SessionConfig) (*SessionInfo, error) {
	hostPort, err := d.allocator.Allocate()
	if err != nil {
		return nil, fmt.Errorf("port allocation: %w", err)
	}

	portBindings := nat.PortMap{
		nat.Port(vncPort): []nat.PortBinding{
			{HostIP: "0.0.0.0", HostPort: strconv.Itoa(hostPort)},
		},
	}
	exposedPorts := nat.PortSet{nat.Port(vncPort): struct{}{}}

	memBytes := int64(cfg.MemoryGB) * 1024 * 1024 * 1024
	nanoCPU := int64(cfg.CPUCores * 1e9)

	resources := container.Resources{
		Memory:   memBytes,
		NanoCPUs: nanoCPU,
	}
	if cfg.GPUEnabled && d.gpuEnabled {
		resources.DeviceRequests = []container.DeviceRequest{
			{
				Driver:       "nvidia",
				Count:        1,
				Capabilities: [][]string{{"gpu"}},
			},
		}
	}

	hostCfg := &container.HostConfig{
		PortBindings:  portBindings,
		Resources:     resources,
		Mounts:        []mount.Mount{},
		RestartPolicy: container.RestartPolicy{Name: "no"},
	}

	containerCfg := &container.Config{
		Image:        cfg.Image,
		ExposedPorts: exposedPorts,
		Labels: map[string]string{
			labelSessionID: cfg.SessionID,
			labelAppID:     cfg.AppID,
			labelWarm:      "false",
		},
		Env: []string{
			fmt.Sprintf("SESSION_ID=%s", cfg.SessionID),
			fmt.Sprintf("APP_ID=%s", cfg.AppID),
		},
	}

	resp, err := d.client.ContainerCreate(
		ctx,
		containerCfg,
		hostCfg,
		nil,
		nil,
		fmt.Sprintf("infinityos-%s", cfg.SessionID),
	)
	if err != nil {
		d.allocator.Release(hostPort)
		return nil, fmt.Errorf("container create: %w", err)
	}

	if err := d.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		d.allocator.Release(hostPort)
		_ = d.client.ContainerRemove(ctx, resp.ID, container.RemoveOptions{Force: true})
		return nil, fmt.Errorf("container start: %w", err)
	}

	log.Info().
		Str("container_id", resp.ID).
		Str("session_id", cfg.SessionID).
		Int("host_port", hostPort).
		Msg("container started")

	return &SessionInfo{
		ContainerID: resp.ID,
		Port:        hostPort,
		VNCUrl:      fmt.Sprintf("http://localhost:%d/vnc.html", hostPort),
	}, nil
}

// Stop removes the container(s) associated with sessionID.
func (d *DockerOrchestrator) Stop(ctx context.Context, sessionID string) error {
	list, err := d.listBySessionID(ctx, sessionID)
	if err != nil {
		return err
	}
	for _, c := range list {
		for _, p := range c.Ports {
			if p.PrivatePort == 6080 {
				d.allocator.Release(int(p.PublicPort))
			}
		}
		if err := d.client.ContainerRemove(ctx, c.ID, container.RemoveOptions{Force: true}); err != nil {
			log.Error().Err(err).Str("container_id", c.ID).Msg("remove container failed")
		}
	}
	return nil
}

// GetStatus inspects the container and maps Docker state to our status string.
func (d *DockerOrchestrator) GetStatus(ctx context.Context, sessionID string) (string, error) {
	list, err := d.listBySessionID(ctx, sessionID)
	if err != nil {
		return "error", err
	}
	if len(list) == 0 {
		return "stopped", nil
	}

	inspect, err := d.client.ContainerInspect(ctx, list[0].ID)
	if err != nil {
		return "error", err
	}

	switch {
	case inspect.State.Running:
		return "ready", nil
	case inspect.State.Paused:
		return "paused", nil
	case inspect.State.Restarting:
		return "starting", nil
	case inspect.State.Dead || inspect.State.OOMKilled:
		return "error", nil
	default:
		return "stopped", nil
	}
}

// Reconcile returns the session IDs of all live infinityos containers.
func (d *DockerOrchestrator) Reconcile(ctx context.Context) ([]string, error) {
	f := filters.NewArgs()
	f.Add("label", labelSessionID)

	list, err := d.client.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: f,
	})
	if err != nil {
		return nil, fmt.Errorf("list containers: %w", err)
	}

	ids := make([]string, 0, len(list))
	for _, c := range list {
		if sid, ok := c.Labels[labelSessionID]; ok && sid != "" {
			ids = append(ids, sid)
		}
	}
	return ids, nil
}

// HasGPUCapacity checks whether the Docker daemon reports an nvidia runtime.
func (d *DockerOrchestrator) HasGPUCapacity(ctx context.Context) bool {
	if !d.gpuEnabled {
		return false
	}
	info, err := d.client.Info(ctx)
	if err != nil {
		return false
	}
	for _, r := range info.Runtimes {
		if strings.Contains(r.Path, "nvidia") {
			return true
		}
	}
	return false
}

// listBySessionID returns containers that have the given session ID label.
func (d *DockerOrchestrator) listBySessionID(ctx context.Context, sessionID string) ([]struct {
	ID    string
	Ports []struct{ PrivatePort, PublicPort uint16 }
}, error) {
	f := filters.NewArgs()
	f.Add("label", fmt.Sprintf("%s=%s", labelSessionID, sessionID))

	list, err := d.client.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: f,
	})
	if err != nil {
		return nil, err
	}

	type portEntry struct{ PrivatePort, PublicPort uint16 }
	type entry struct {
		ID    string
		Ports []portEntry
	}

	result := make([]struct {
		ID    string
		Ports []struct{ PrivatePort, PublicPort uint16 }
	}, 0, len(list))

	for _, c := range list {
		e := struct {
			ID    string
			Ports []struct{ PrivatePort, PublicPort uint16 }
		}{ID: c.ID}
		for _, p := range c.Ports {
			e.Ports = append(e.Ports, struct{ PrivatePort, PublicPort uint16 }{
				PrivatePort: p.PrivatePort,
				PublicPort:  p.PublicPort,
			})
		}
		result = append(result, e)
	}
	return result, nil
}
