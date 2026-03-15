import { apiClient } from "./client";
import type { App } from "@/types";

export const appsApi = {
  list: () => apiClient.get<{ apps: App[] }>("/apps"),
  get: (id: string) => apiClient.get<{ app: App }>(`/apps/${id}`),
};
