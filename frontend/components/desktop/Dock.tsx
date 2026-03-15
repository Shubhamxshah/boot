"use client";
import { motion } from "framer-motion";
import { useWindowStore } from "@/store/windowStore";
import { useDesktopStore } from "@/store/desktopStore";
import { sessionsApi } from "@/lib/api/sessions";
import { useQueryClient } from "@tanstack/react-query";
import { DrawerIcon, VSCodeIcon, BlenderIcon, UbuntuIcon, GazeboIcon } from "./AppIcons";

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
