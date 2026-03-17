"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appsApi } from "@/lib/api/apps";
import { billingApi } from "@/lib/api/billing";
import { getAppIcon, getAppColor } from "@/lib/utils";
import type { App } from "@/types";

// Client-side credit cost estimate (mirrors backend CalcCostPerMinute)
function calcCostPerMinute(cpu: number, memGb: number, gpu: boolean): number {
  const cost = 0.5 + cpu * 0.1 + memGb * 0.05 + (gpu ? 2 : 0);
  return Math.ceil(cost);
}

function AppRow({ app }: { app: App }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [cpuCores, setCpuCores] = useState(app.cpu_cores);
  const [memoryGb, setMemoryGb] = useState(app.memory_gb);
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [idleMinutes, setIdleMinutes] = useState(app.idle_minutes);
  const [saved, setSaved] = useState(false);

  // Load saved settings
  const { data: settingsData } = useQuery({
    queryKey: ["app-settings", app.id],
    queryFn: () => billingApi.getAppSettings(app.id),
    retry: false,
  });

  // Initialize from saved settings when data arrives
  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      setCpuCores(s.cpu_cores);
      setMemoryGb(s.memory_gb);
      setGpuEnabled(s.gpu_enabled);
      setIdleMinutes(s.idle_minutes);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: () =>
      billingApi.saveAppSettings(app.id, {
        cpu_cores: cpuCores,
        memory_gb: memoryGb,
        gpu_enabled: gpuEnabled,
        idle_minutes: idleMinutes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings", app.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const costPerMin = calcCostPerMinute(cpuCores, memoryGb, gpuEnabled);

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 text-left transition-colors"
        style={{ padding: "18px 20px", borderRadius: 14 }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${getAppColor(app.id)}22` }}
        >
          {getAppIcon(app.id)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{app.name}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{cpuCores} CPU</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{memoryGb}GB RAM</span>
            {gpuEnabled && <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>GPU</span>}
          </div>
        </div>
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{costPerMin} cr/min</span>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "22px 22px" }}>
          <div className="space-y-6">
            {/* CPU cores */}
            <div className="flex items-center justify-between">
              <label className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>CPU Cores</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCpuCores(Math.max(1, cpuCores - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>−</button>
                <span className="text-sm w-6 text-center" style={{ color: "rgba(255,255,255,0.8)" }}>{cpuCores}</span>
                <button onClick={() => setCpuCores(Math.min(16, cpuCores + 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>+</button>
              </div>
            </div>

            {/* Memory */}
            <div className="flex items-center justify-between">
              <label className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Memory</label>
              <select
                value={memoryGb}
                onChange={(e) => setMemoryGb(Number(e.target.value))}
                className="text-sm rounded-lg px-3 py-1.5 outline-none"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "none" }}
              >
                {[1, 2, 4, 8, 16, 32].map((v) => (
                  <option key={v} value={v}>{v}GB</option>
                ))}
              </select>
            </div>

            {/* GPU */}
            {(app.gpu_required || app.gpu_optional) && (
              <div className="flex items-center justify-between">
                <label className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>GPU Acceleration</label>
                <button
                  onClick={() => setGpuEnabled(!gpuEnabled)}
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{ background: gpuEnabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                    style={{ background: "rgba(255,255,255,0.9)", left: gpuEnabled ? "calc(100% - 22px)" : "2px" }}
                  />
                </button>
              </div>
            )}

            {/* Auto-stop */}
            <div className="flex items-center justify-between">
              <label className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Auto-stop (idle min)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setIdleMinutes(Math.max(2, idleMinutes - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>−</button>
                <span className="text-sm w-8 text-center" style={{ color: "rgba(255,255,255,0.8)" }}>{idleMinutes}</span>
                <button onClick={() => setIdleMinutes(Math.min(1440, idleMinutes + 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>+</button>
              </div>
            </div>

            {/* Cost estimate + Save */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {costPerMin} credits/min
              </span>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                style={{ background: saved ? "rgba(0,200,150,0.2)" : "rgba(255,255,255,0.12)", color: saved ? "rgba(0,200,150,0.9)" : "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                {saveMutation.isPending ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </button>
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Applications</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Configure default settings per app</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="space-y-3.5">
          {data?.apps.map((app) => <AppRow key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}
