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
  windowType: "app" | "files" | "terminal";
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

export interface UserCredits {
  balance: number;
  transactions: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: "session_usage" | "purchase" | "bonus";
  amount: number;
  balance_after: number;
  description: string;
  session_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface AppSettings {
  user_id: string;
  app_id: string;
  cpu_cores: number;
  memory_gb: number;
  gpu_enabled: boolean;
  idle_minutes: number;
  updated_at: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount_cents: number;
  credits: number;
  razorpay_key_id: string;
}

export interface VerifyPaymentResponse {
  balance: number;
  credits_added: number;
}
