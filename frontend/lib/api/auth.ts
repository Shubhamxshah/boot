import { apiClient } from "./client";
import type { AuthResponse, User } from "@/types";

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  me: () => apiClient.get<User>("/auth/me"),

  logout: () => apiClient.post("/auth/logout"),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/auth/refresh", { refresh_token: refreshToken }),

  googleLoginUrl: () =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/auth/google/login`,
};
