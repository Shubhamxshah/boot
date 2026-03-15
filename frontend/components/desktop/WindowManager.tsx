"use client";
import { useWindowStore } from "@/store/windowStore";
import { AppWindow } from "./AppWindow";

export function WindowManager() {
  const { windows } = useWindowStore();

  return (
    <div
      className="absolute inset-0"
      style={{ top: 52, bottom: 80, zIndex: 100 }}
    >
      {windows.map((win) => (
        <AppWindow key={win.sessionId} window={win} />
      ))}
    </div>
  );
}
