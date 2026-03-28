"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/auth";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const token = params.get("token");
    if (!token) { router.replace("/app"); return; }

    // Guard against Strict Mode double-invoke
    if (localStorage.getItem("access_token") === token) {
      router.replace("/app");
      return;
    }

    localStorage.setItem("access_token", token);
    setToken(token);

    authApi.me().then((user) => {
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      router.replace("/app");
    }).catch(() => {
      router.replace("/app");
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4" style={{ background: "#0a0f0d" }}>
      <div className="w-10 h-10 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#6b8a7a] text-sm">Signing you in...</p>
    </div>
  );
}

export function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen" style={{ background: "#0a0f0d" }}>
        <div className="w-8 h-8 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
