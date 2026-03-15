"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize().then(() => {
      if (useAuthStore.getState().isAuthenticated) {
        router.replace("/desktop");
      } else {
        router.replace("/login");
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen" style={{ background: "#0a0f0d" }}>
      <div className="w-8 h-8 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
