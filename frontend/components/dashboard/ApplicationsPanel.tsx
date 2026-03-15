"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appsApi } from "@/lib/api/apps";
import { getAppIcon, getAppColor } from "@/lib/utils";
import type { App } from "@/types";

function AppRow({ app }: { app: App }) {
  const [expanded, setExpanded] = useState(false);
  const [cpuCores, setCpuCores] = useState(app.cpu_cores);
  const [memoryGb, setMemoryGb] = useState(app.memory_gb);
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [idleMinutes, setIdleMinutes] = useState(app.idle_minutes);

  return (
    <div style={{ background: "#111a16", border: "1px solid #1f2e28", borderRadius: 12 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
        onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        style={{ borderRadius: 12 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${getAppColor(app.id)}22` }}
        >
          {getAppIcon(app.id)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#e8f0ec]">{app.name}</p>
          <div className="flex gap-2 mt-0.5">
            <span className="text-xs text-[#6b8a7a]">{app.cpu_cores} CPU</span>
            <span className="text-xs text-[#6b8a7a]">{app.memory_gb}GB RAM</span>
            {(app.gpu_required || app.gpu_optional) && (
              <span className="text-xs" style={{ color: "#00c896" }}>GPU</span>
            )}
          </div>
        </div>
        <span className="text-[#6b8a7a] text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid #1f2e28" }}>
          <div className="pt-4 space-y-4">
            {/* CPU cores */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-[#6b8a7a]">CPU Cores</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCpuCores(Math.max(1, cpuCores - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "#1f2e28", color: "#e8f0ec" }}>−</button>
                <span className="text-sm text-[#e8f0ec] w-6 text-center">{cpuCores}</span>
                <button onClick={() => setCpuCores(Math.min(16, cpuCores + 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "#1f2e28", color: "#e8f0ec" }}>+</button>
              </div>
            </div>

            {/* Memory */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-[#6b8a7a]">Memory</label>
              <select
                value={memoryGb}
                onChange={(e) => setMemoryGb(Number(e.target.value))}
                className="text-sm rounded-lg px-3 py-1.5 outline-none"
                style={{ background: "#1f2e28", color: "#e8f0ec", border: "none" }}
              >
                {[1, 2, 4, 8, 16, 32].map((v) => (
                  <option key={v} value={v}>{v}GB</option>
                ))}
              </select>
            </div>

            {/* GPU */}
            {(app.gpu_required || app.gpu_optional) && (
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#6b8a7a]">GPU Acceleration</label>
                <button
                  onClick={() => setGpuEnabled(!gpuEnabled)}
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{ background: gpuEnabled ? "#00c896" : "#1f2e28" }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                    style={{
                      background: "#e8f0ec",
                      left: gpuEnabled ? "calc(100% - 22px)" : "2px",
                    }}
                  />
                </button>
              </div>
            )}

            {/* Auto-stop */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-[#6b8a7a]">Auto-stop (idle min)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setIdleMinutes(Math.max(2, idleMinutes - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "#1f2e28", color: "#e8f0ec" }}>−</button>
                <span className="text-sm text-[#e8f0ec] w-8 text-center">{idleMinutes}</span>
                <button onClick={() => setIdleMinutes(Math.min(1440, idleMinutes + 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "#1f2e28", color: "#e8f0ec" }}>+</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApplicationsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => appsApi.list(),
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[#e8f0ec] mb-1">Applications</h3>
        <p className="text-sm text-[#6b8a7a]">Configure default settings per app</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {data?.apps.map((app) => <AppRow key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}
