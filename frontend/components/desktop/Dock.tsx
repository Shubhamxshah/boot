"use client";
import { motion } from "framer-motion";
import { useWindowStore } from "@/store/windowStore";
import { useDesktopStore } from "@/store/desktopStore";
import { sessionsApi } from "@/lib/api/sessions";
import { useQueryClient } from "@tanstack/react-query";

const DrawerIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
  </svg>
);

const VSCodeIcon = () => (
  <svg width="34" height="34" viewBox="0 0 100 100">
    <path d="M74.9 6.6L51 43.9 31.5 26.4 6 40.1v19.8l25.5 13.7L51 55.9l23.9 37.3L94 81.8V18.2L74.9 6.6z" fill="#007ACC"/>
    <path d="M6 40.1l25.5 13.7L51 43.9 31.5 26.4z" fill="white" opacity="0.35"/>
    <path d="M74.9 93.4L51 55.9l23.9-12.0V93.4z" fill="white" opacity="0.35"/>
  </svg>
);

const BlenderIcon = () => (
  <svg width="34" height="34" viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="60" fill="#EA7600"/>
    <circle cx="64" cy="64" r="38" fill="white"/>
    <circle cx="64" cy="64" r="23" fill="#EA7600"/>
    <circle cx="64" cy="64" r="11" fill="white"/>
    <rect x="60" y="8" width="8" height="30" rx="4" fill="white"/>
    <rect x="90" y="44" width="30" height="8" rx="4" fill="white" transform="rotate(60 105 48)"/>
    <rect x="8" y="44" width="30" height="8" rx="4" fill="white" transform="rotate(-60 23 48)"/>
  </svg>
);

const UbuntuIcon = () => (
  <svg width="34" height="34" viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="60" fill="#E95420"/>
    <circle cx="64" cy="26" r="11" fill="white"/>
    <circle cx="26" cy="88" r="11" fill="white"/>
    <circle cx="102" cy="88" r="11" fill="white"/>
    <circle cx="64" cy="64" r="18" fill="none" stroke="white" strokeWidth="7"/>
    <line x1="64" y1="37" x2="64" y2="46" stroke="white" strokeWidth="7"/>
    <line x1="37" y1="80" x2="45" y2="76" stroke="white" strokeWidth="7"/>
    <line x1="91" y1="80" x2="83" y2="76" stroke="white" strokeWidth="7"/>
  </svg>
);

const GazeboIcon = () => (
  <svg width="34" height="34" viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="60" fill="#1a2433"/>
    <circle cx="64" cy="44" r="14" fill="#6B4FBB"/>
    <rect x="50" y="56" width="28" height="32" rx="4" fill="#6B4FBB"/>
    <rect x="36" y="62" width="14" height="8" rx="4" fill="#8b6fd4"/>
    <rect x="78" y="62" width="14" height="8" rx="4" fill="#8b6fd4"/>
    <rect x="52" y="88" width="10" height="18" rx="4" fill="#8b6fd4"/>
    <rect x="66" y="88" width="10" height="18" rx="4" fill="#8b6fd4"/>
    <circle cx="59" cy="41" r="4" fill="white"/>
    <circle cx="69" cy="41" r="4" fill="white"/>
    <circle cx="59" cy="41" r="2" fill="#111"/>
    <circle cx="69" cy="41" r="2" fill="#111"/>
  </svg>
);

const DOCK_APPS = [
  { id: "drawer", name: "App Drawer", icon: <DrawerIcon />, color: "#6b8a7a", isDrawer: true },
  { id: "vscode", name: "VS Code", icon: <VSCodeIcon />, color: "#007ACC" },
  { id: "blender", name: "Blender", icon: <BlenderIcon />, color: "#EA7600" },
  { id: "ubuntu", name: "Ubuntu", icon: <UbuntuIcon />, color: "#E95420" },
  { id: "gazebo", name: "Gazebo", icon: <GazeboIcon />, color: "#6B4FBB" },
];

export function Dock() {
  const { openWindow, getWindowByAppId, focusWindow } = useWindowStore();
  const { setShowAppDrawer, showAppDrawer } = useDesktopStore();
  const qc = useQueryClient();

  const launchApp = async (appId: string) => {
    const existing = getWindowByAppId(appId);
    if (existing) {
      focusWindow(existing.sessionId);
      return;
    }

    try {
      const res = await sessionsApi.launch({ app_id: appId });
      const sessionId = res.session_id || res.session?.id;

      openWindow({
        sessionId,
        appId,
        appName: DOCK_APPS.find((a) => a.id === appId)?.name || appId,
        vncUrl: "",
        status: "loading",
        x: 80,
        y: 80,
        width: 1000,
        height: 700,
        minimized: false,
        maximized: false,
      });

      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Launch failed", err);
    }
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-4"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 28,
        padding: "12px 20px",
        zIndex: 200,
      }}
    >
      {DOCK_APPS.map((app) => {
        const win = app.isDrawer ? null : getWindowByAppId(app.id);
        const isOpen = !!win;
        const isActive = app.isDrawer ? showAppDrawer : (isOpen && !win?.minimized);

        return (
          <div key={app.id} className="relative flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.25, y: -6 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => app.isDrawer ? setShowAppDrawer(!showAppDrawer) : launchApp(app.id)}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: isActive ? "#1a2820" : "#0d1814",
                border: `1px solid ${isActive ? "#00c896" : "#1f2e28"}`,
              }}
              title={app.name}
            >
              {app.icon}
            </motion.button>

            {isOpen && (
              <div
                className="absolute -bottom-1 w-1 h-1 rounded-full"
                style={{ background: "#00c896" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
