"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesktopStore } from "@/store/desktopStore";
import { useWindowStore } from "@/store/windowStore";
import { sessionsApi } from "@/lib/api/sessions";
import { useQuery } from "@tanstack/react-query";
import { appsApi } from "@/lib/api/apps";
import { getAppColor } from "@/lib/utils";
import { getAppSvgIcon } from "./AppIcons";
import type { App } from "@/types";

const CATEGORIES = ["All", "development", "creative", "desktop", "robotics"];

const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  development: "Development",
  creative: "Creative",
  desktop: "Desktop",
  robotics: "Robotics",
};

export function AppDrawer() {
  const { setShowAppDrawer, setDashboardPanel, setShowDashboard } = useDesktopStore();
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
        windowType: "app",
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
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("insufficient credits")) {
        setDashboardPanel("credits");
        setShowDashboard(true);
      }
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(28px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 flex flex-col items-center justify-start"
      style={{ background: "rgba(0,0,0,0.70)", zIndex: 300 }}
      onClick={() => setShowAppDrawer(false)}
    >
      {/* Content container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center w-full"
        style={{ paddingTop: "72px", paddingBottom: "100px" }}
      >
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="w-full"
          style={{ maxWidth: 560 }}
        >
          <input
            type="text"
            autoFocus
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-base outline-none"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 16,
              padding: "14px 20px",
              color: "#ffffff",
              caretColor: "#00c896",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
          />
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.2 }}
          style={{ marginTop: 28, marginBottom: 24, display: "flex", gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="text-sm transition-all"
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: isActive ? "rgba(255,255,255,0.16)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                  border: `1px solid ${isActive ? "rgba(255,255,255,0.22)" : "transparent"}`,
                  fontWeight: isActive ? 500 : 400,
                  cursor: "pointer",
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </motion.div>

        {/* App grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.22 }}
          className="w-full"
          style={{ maxWidth: 760, padding: "0 24px" }}
        >
          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
                gap: "12px",
              }}
            >
              <AnimatePresence>
                {filtered.map((app, i) => {
                  const color = getAppColor(app.id);
                  return (
                    <motion.button
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: i * 0.03, duration: 0.18 }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => launchApp(app)}
                      className="flex flex-col items-center text-center"
                      style={{
                        padding: "16px 12px",
                        borderRadius: 20,
                        background: "transparent",
                        border: "1px solid transparent",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                        gap: 0,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 18,
                          background: `${color}20`,
                          border: `1px solid ${color}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                          flexShrink: 0,
                        }}
                      >
                        {getAppSvgIcon(app.id, 36)}
                      </div>

                      {/* App name */}
                      <span
                        className="leading-tight"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.92)",
                          display: "block",
                        }}
                      >
                        {app.name}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div
              className="text-center py-16"
              style={{ color: "rgba(255,255,255,0.28)", fontSize: 15 }}
            >
              No apps found
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
