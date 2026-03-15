import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, type LaunchSessionRequest } from "@/lib/api/sessions";

export function useSessions() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list(),
    refetchInterval: 5000,
  });

  const launchMutation = useMutation({
    mutationFn: (req: LaunchSessionRequest) => sessionsApi.launch(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  return {
    sessions: data?.sessions || [],
    isLoading,
    launch: launchMutation.mutateAsync,
    stop: stopMutation.mutateAsync,
  };
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.get(id),
    refetchInterval: 2000,
    enabled: !!id,
  });
}
