export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  auth_provider: "google" | "email";
  created_at: string;
}

export interface App {
  id: string;
  name: string;
  description: string;
  image: string;
  cpu_cores: number;
  memory_gb: number;
  gpu_required: boolean;
  gpu_optional: boolean;
  idle_minutes: number;
  warm_pool_size: number;
  category: string;
}

export interface Session {
  id: string;
  user_id: string;
  app_id: string;
  status: "starting" | "ready" | "idle" | "stopping" | "stopped" | "error";
  container_id?: string;
  pod_name?: string;
  node_port?: number;
  vnc_url?: string;
  cpu_cores: number;
  memory_gb: number;
  gpu_enabled: boolean;
  idle_minutes: number;
  startup_boost: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  last_heartbeat: string;
  stopped_at?: string;
}

export interface DesktopWindow {
  sessionId: string;
  appId: string;
  appName: string;
  vncUrl: string;
  status: "loading" | "ready" | "error";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AppsResponse {
  apps: App[];
}
