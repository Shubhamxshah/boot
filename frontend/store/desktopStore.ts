import { create } from "zustand";

interface DesktopState {
  dockPosition: "bottom" | "left";
  showAppDrawer: boolean;
  showDashboard: boolean;
  dashboardPanel: string;
  showUserMenu: boolean;
  setDockPosition: (pos: "bottom" | "left") => void;
  setShowAppDrawer: (v: boolean) => void;
  setShowDashboard: (v: boolean) => void;
  setDashboardPanel: (panel: string) => void;
  setShowUserMenu: (v: boolean) => void;
}

export const useDesktopStore = create<DesktopState>((set) => ({
  dockPosition: "bottom",
  showAppDrawer: false,
  showDashboard: false,
  dashboardPanel: "credits",
  showUserMenu: false,
  setDockPosition: (pos) => set({ dockPosition: pos }),
  setShowAppDrawer: (v) => set({ showAppDrawer: v }),
  setShowDashboard: (v) => set({ showDashboard: v }),
  setDashboardPanel: (panel) => set({ dashboardPanel: panel }),
  setShowUserMenu: (v) => set({ showUserMenu: v }),
}));
