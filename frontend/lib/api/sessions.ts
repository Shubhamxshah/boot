import { apiClient } from "./client";
import type { Session } from "@/types";

export interface LaunchSessionRequest {
  app_id: string;
  cpu_cores?: number;
  memory_gb?: number;
  gpu_enabled?: boolean;
}

export interface LaunchSessionResponse {
  session_id: string;
  status: string;
  session: Session;
}

export const sessionsApi = {
  launch: (data: LaunchSessionRequest) =>
    apiClient.post<LaunchSessionResponse>("/sessions", data),

  list: () => apiClient.get<{ sessions: Session[] }>("/sessions"),

  get: (id: string) => apiClient.get<{ session: Session }>(`/sessions/${id}`),

  stop: (id: string) => apiClient.delete(`/sessions/${id}`),

  heartbeat: (id: string) => apiClient.post(`/sessions/${id}/heartbeat`),
};
