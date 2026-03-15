"use client";
import { useEffect, useCallback } from "react";
import { useDesktopStore } from "@/store/desktopStore";
import { useWindowStore } from "@/store/windowStore";
import { TopBar } from "./TopBar";
import { Dock } from "./Dock";
import { WindowManager } from "./WindowManager";
import { AppDrawer } from "./AppDrawer";
import { Dashboard } from "../dashboard/Dashboard";

export function Desktop() {
  const { showAppDrawer, setShowAppDrawer, setShowDashboard, showDashboard } = useDesktopStore();
  const { focusedWindowId, minimizeWindow, maximizeWindow, closeWindow } = useWindowStore();

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
      style={{
        background: "radial-gradient(ellipse at 50% 60%, #0d3d2e 0%, #061209 60%, #020805 100%)",
      }}
    >
      <TopBar />
      <WindowManager />
      <Dock />
      {showAppDrawer && <AppDrawer />}
      {showDashboard && <Dashboard />}
    </div>
  );
}
