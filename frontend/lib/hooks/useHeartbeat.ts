import { useEffect, useRef } from "react";
import { sessionsApi } from "@/lib/api/sessions";

export function useHeartbeat(sessionId: string | null, active: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId || !active) return;

    const beat = () => {
      sessionsApi.heartbeat(sessionId).catch(() => {});
    };

    beat();
    intervalRef.current = setInterval(beat, 20000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, active]);
}
