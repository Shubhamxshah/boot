import { create } from "zustand";
import type { DesktopWindow } from "@/types";

interface WindowStore {
  windows: DesktopWindow[];
  focusedWindowId: string | null;
  nextZIndex: number;

  openWindow: (win: Omit<DesktopWindow, "zIndex">) => void;
  closeWindow: (sessionId: string) => void;
  focusWindow: (sessionId: string) => void;
  minimizeWindow: (sessionId: string) => void;
  maximizeWindow: (sessionId: string) => void;
  updateWindowPosition: (sessionId: string, x: number, y: number) => void;
  updateWindowSize: (sessionId: string, w: number, h: number) => void;
  updateWindowStatus: (sessionId: string, status: DesktopWindow["status"], vncUrl?: string) => void;
  hasWindow: (sessionId: string) => boolean;
  getWindowByAppId: (appId: string) => DesktopWindow | undefined;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  focusedWindowId: null,
  nextZIndex: 100,

  openWindow: (win) => {
    const zIndex = get().nextZIndex;
    const offset = get().windows.length * 30;
    set((s) => ({
      windows: [
        ...s.windows,
        {
          ...win,
          x: win.x + offset,
          y: win.y + offset,
          zIndex,
        },
      ],
      focusedWindowId: win.sessionId,
      nextZIndex: zIndex + 1,
    }));
  },

  closeWindow: (sessionId) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.sessionId !== sessionId),
      focusedWindowId:
        s.focusedWindowId === sessionId ? null : s.focusedWindowId,
    })),

  focusWindow: (sessionId) => {
    const zIndex = get().nextZIndex;
    set((s) => ({
      windows: s.windows.map((w) =>
        w.sessionId === sessionId ? { ...w, zIndex, minimized: false } : w
      ),
      focusedWindowId: sessionId,
      nextZIndex: zIndex + 1,
    }));
  },

  minimizeWindow: (sessionId) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.sessionId === sessionId ? { ...w, minimized: true } : w
      ),
      focusedWindowId:
        s.focusedWindowId === sessionId ? null : s.focusedWindowId,
    })),

  maximizeWindow: (sessionId) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.sessionId === sessionId ? { ...w, maximized: !w.maximized } : w
      ),
    })),

  updateWindowPosition: (sessionId, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.sessionId === sessionId ? { ...w, x, y } : w
      ),
    })),

  updateWindowSize: (sessionId, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.sessionId === sessionId ? { ...w, width, height } : w
      ),
    })),

  updateWindowStatus: (sessionId, status, vncUrl) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.sessionId === sessionId
          ? { ...w, status, ...(vncUrl ? { vncUrl } : {}) }
          : w
      ),
    })),

  hasWindow: (sessionId) =>
    get().windows.some((w) => w.sessionId === sessionId),

  getWindowByAppId: (appId) =>
    get().windows.find((w) => w.appId === appId),
}));
