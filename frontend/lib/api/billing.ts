import { apiClient } from "./client";
import type {
  UserCredits,
  AppSettings,
  CreateOrderResponse,
  VerifyPaymentResponse,
} from "@/types";

export const billingApi = {
  getBalance: (): Promise<UserCredits> =>
    apiClient.get<UserCredits>("/credits"),

  createOrder: (packId: string): Promise<CreateOrderResponse> =>
    apiClient.post<CreateOrderResponse>("/credits/orders", { pack_id: packId }),

  verifyPayment: (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<VerifyPaymentResponse> =>
    apiClient.post<VerifyPaymentResponse>("/credits/verify", {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),

  getAppSettings: (appId: string): Promise<{ settings: AppSettings }> =>
    apiClient.get<{ settings: AppSettings }>(`/apps/${appId}/settings`),

  saveAppSettings: (
    appId: string,
    settings: {
      cpu_cores: number;
      memory_gb: number;
      gpu_enabled: boolean;
      idle_minutes: number;
    }
  ): Promise<{ settings: AppSettings }> =>
    apiClient.put<{ settings: AppSettings }>(`/apps/${appId}/settings`, settings),
};
