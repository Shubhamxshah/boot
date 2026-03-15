"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Desktop } from "./Desktop";

export function DesktopPage() {
  const { isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0a0f0d" }}>
        <div className="w-8 h-8 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Desktop />;
}
