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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#e8f0ec]">Active Sessions</h3>
          <p className="text-xs text-[#6b8a7a] mt-0.5">
            Manage your running app sessions
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={stopAll}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ background: "#e0555520", color: "#e05555", border: "1px solid #e0555540" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#e0555530")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#e0555520")}
          >
            Stop All
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-[#3d5448] text-sm">No active sessions</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-xl"
              style={{ background: "#111a16", border: "1px solid #1f2e28" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🖥️</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#e8f0ec]">{s.app_id}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: s.status === "ready" ? "#00c89620" : "#1f2e28",
                          color: s.status === "ready" ? "#00c896" : "#6b8a7a",
                        }}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b8a7a] mt-0.5">
                      {s.cpu_cores} CPU · {s.memory_gb}GB RAM
                      {s.gpu_enabled && " · GPU"}
                    </p>
                    <p className="text-xs text-[#3d5448] mt-0.5">
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
                  style={{ background: "#1f2e28", color: "#6b8a7a" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#e0555520"; e.currentTarget.style.color = "#e05555"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#1f2e28"; e.currentTarget.style.color = "#6b8a7a"; }}
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
