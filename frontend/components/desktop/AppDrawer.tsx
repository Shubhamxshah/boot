"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useDesktopStore } from "@/store/desktopStore";
import { useWindowStore } from "@/store/windowStore";
import { sessionsApi } from "@/lib/api/sessions";
import { useQuery } from "@tanstack/react-query";
import { appsApi } from "@/lib/api/apps";
import { getAppIcon, getAppColor } from "@/lib/utils";
import type { App } from "@/types";

const CATEGORIES = ["All", "development", "creative", "desktop", "robotics"];

export function AppDrawer() {
  const { setShowAppDrawer } = useDesktopStore();
  const { openWindow, getWindowByAppId, focusWindow } = useWindowStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data } = useQuery({
    queryKey: ["apps"],
    queryFn: () => appsApi.list(),
  });

  const apps = data?.apps || [];
  const filtered = apps.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || a.category === category;
    return matchSearch && matchCat;
  });

  const launchApp = async (app: App) => {
    setShowAppDrawer(false);
    const existing = getWindowByAppId(app.id);
    if (existing) { focusWindow(existing.sessionId); return; }

    try {
      const res = await sessionsApi.launch({ app_id: app.id });
      const sessionId = res.session_id || res.session?.id;
      openWindow({
        sessionId,
        appId: app.id,
        appName: app.name,
        vncUrl: "",
        status: "loading",
        x: 80,
        y: 80,
        width: 1000,
        height: 700,
        minimized: false,
        maximized: false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center pt-16 pb-24"
      style={{ background: "rgba(10, 15, 13, 0.96)", backdropFilter: "blur(20px)", zIndex: 300 }}
      onClick={() => setShowAppDrawer(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl">
        <input
          type="text"
          autoFocus
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-5 py-3 rounded-2xl text-base outline-none mb-6"
          style={{ background: "#111a16", border: "1px solid #1f2e28", color: "#e8f0ec" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />

        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm capitalize transition-colors"
              style={{
                background: category === cat ? "#00c896" : "#111a16",
                color: category === cat ? "#020805" : "#6b8a7a",
                border: `1px solid ${category === cat ? "#00c896" : "#1f2e28"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* App grid */}
        <div className="grid grid-cols-6 gap-4">
          {filtered.map((app) => (
            <motion.button
              key={app.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => launchApp(app)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors"
              style={{ background: "#111a16", border: "1px solid #1f2e28" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#111a16")}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${getAppColor(app.id)}22` }}
              >
                {getAppIcon(app.id)}
              </div>
              <span className="text-xs text-[#e8f0ec] text-center leading-tight">{app.name}</span>
              <div className="flex gap-1 flex-wrap justify-center">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1f2e28", color: "#6b8a7a" }}>
                  {app.cpu_cores}C
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1f2e28", color: "#6b8a7a" }}>
                  {app.memory_gb}GB
                </span>
                {app.gpu_required && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#00c89622", color: "#00c896" }}>
                    GPU
                  </span>
                )}
              </div>
            </motion.button>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-6 text-center py-12 text-[#3d5448]">No apps found</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
