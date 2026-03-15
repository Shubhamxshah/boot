"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useDesktopStore } from "@/store/desktopStore";
import { useWindowStore } from "@/store/windowStore";
import { useAuthStore } from "@/store/authStore";
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
      className="fixed inset-0 flex flex-col items-center pt-20 pb-24"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(24px)", zIndex: 300 }}
      onClick={() => setShowAppDrawer(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl px-4">
        <input
          type="text"
          autoFocus
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-5 py-3.5 rounded-2xl text-base outline-none mb-6"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />

        {/* Category tabs */}
        <div className="flex gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm capitalize transition-all"
              style={{
                background: category === cat ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                color: category === cat ? "#ffffff" : "rgba(255,255,255,0.5)",
                border: `1px solid ${category === cat ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
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
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${getAppColor(app.id)}22` }}
              >
                {getAppIcon(app.id)}
              </div>
              <span className="text-xs text-center leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>{app.name}</span>
              <div className="flex gap-1 flex-wrap justify-center">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                  {app.cpu_cores}C
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                  {app.memory_gb}GB
                </span>
                {app.gpu_required && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
                    GPU
                  </span>
                )}
              </div>
            </motion.button>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-6 text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>No apps found</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
