"use client";
import { useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useDesktopStore } from "@/store/desktopStore";
import { useWindowStore } from "@/store/windowStore";
import { useAuthStore } from "@/store/authStore";
import { TopBar } from "./TopBar";
import { Dock } from "./Dock";
import { WindowManager } from "./WindowManager";
import { AppDrawer } from "./AppDrawer";
import { Dashboard } from "../dashboard/Dashboard";

export function Desktop() {
  const { showAppDrawer, setShowAppDrawer, setShowDashboard, showDashboard, wallpaper } = useDesktopStore();
  const { focusedWindowId, minimizeWindow, maximizeWindow, closeWindow } = useWindowStore();
  const { isAuthenticated } = useAuthStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.altKey) {
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setShowAppDrawer(!showAppDrawer);
      }
      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        if (focusedWindowId) closeWindow(focusedWindowId);
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (focusedWindowId) minimizeWindow(focusedWindowId);
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (focusedWindowId) maximizeWindow(focusedWindowId);
      }
    }
    if (e.key === "Escape") {
      if (showAppDrawer) setShowAppDrawer(false);
      else if (showDashboard) setShowDashboard(false);
    }
  }, [showAppDrawer, showDashboard, focusedWindowId]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={(() => {
        if (!wallpaper) return { background: "radial-gradient(ellipse at 50% 60%, #0d3d2e 0%, #061209 60%, #020805 100%)" };
        const PRESET_CSS: Record<string, string> = {
          "preset:midnight": "radial-gradient(ellipse at 30% 40%, #0d1a3d 0%, #060a12 60%, #020408 100%)",
          "preset:dusk": "radial-gradient(ellipse at 60% 30%, #2d1a3d 0%, #12060e 60%, #080208 100%)",
          "preset:ember": "radial-gradient(ellipse at 50% 70%, #3d1a0d 0%, #120806 60%, #080202 100%)",
          "preset:slate": "radial-gradient(ellipse at 50% 50%, #1a1f2e 0%, #0a0c12 60%, #050608 100%)",
          "preset:void": "#020202",
        };
        if (wallpaper.startsWith("preset:")) return { background: PRESET_CSS[wallpaper] ?? "" };
        return { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" };
      })()}
    >
      <TopBar />
      <WindowManager />
      {isAuthenticated && <Dock />}
      <AnimatePresence>{showAppDrawer && <AppDrawer />}</AnimatePresence>
      <AnimatePresence>{showDashboard && <Dashboard />}</AnimatePresence>
    </div>
  );
}
