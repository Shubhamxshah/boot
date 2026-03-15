"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/sessions";
import { formatRelativeTime } from "@/lib/utils";
import { useWindowStore } from "@/store/windowStore";

export function SessionsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list(),
  });

  const { closeWindow } = useWindowStore();
  const qc = useQueryClient();

  const stopAll = async () => {
    for (const s of data?.sessions || []) {
      try {
        await sessionsApi.stop(s.id);
        closeWindow(s.id);
      } catch {}
    }
    qc.invalidateQueries({ queryKey: ["sessions"] });
  };

  const sessions = (data?.sessions || []).filter(
    (s) => !["stopped", "error"].includes(s.status)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Active Sessions</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Manage your running app sessions
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={stopAll}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ background: "rgba(255,80,80,0.12)", color: "rgba(255,120,120,0.9)", border: "1px solid rgba(255,80,80,0.2)" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,80,80,0.2)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,80,80,0.12)")}
          >
            Stop All
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "transparent" }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No active sessions</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "18px 20px" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{s.app_id}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: s.status === "ready" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                          color: s.status === "ready" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {s.cpu_cores} CPU · {s.memory_gb}GB RAM{s.gpu_enabled && " · GPU"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Last active {formatRelativeTime(s.last_heartbeat)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await sessionsApi.stop(s.id);
                    closeWindow(s.id);
                    qc.invalidateQueries({ queryKey: ["sessions"] });
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.15)"; e.currentTarget.style.color = "rgba(255,120,120,0.9)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Stop
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
