import { useEffect } from "react";
import { useWindowStore } from "@/store/windowStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

export function useSessionCleanup() {
  useEffect(() => {
    const handlePageHide = () => {
      const { windows } = useWindowStore.getState();
      const token = localStorage.getItem("access_token");
      if (!token) return;

      for (const win of windows) {
        const isSessionBacked = win.windowType === "app" || win.windowType === "terminal" || !win.windowType;
        if (!isSessionBacked) continue;
        if (win.status !== "ready" && win.status !== "loading") continue;

        fetch(`${API_URL}/sessions/${win.sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);
}
