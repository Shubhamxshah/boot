"use client";
import { motion } from "framer-motion";
import { useDesktopStore } from "@/store/desktopStore";
import { CreditsPanel } from "./CreditsPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SystemPanel } from "./SystemPanel";
import { ShortcutsPanel } from "./ShortcutsPanel";
import { ApplicationsPanel } from "./ApplicationsPanel";
import { SessionsPanel } from "./SessionsPanel";
import { AppearancePanel } from "./AppearancePanel";

const NAV = [
  { id: "credits", label: "Credits", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  )},
  { id: "profile", label: "Profile", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )},
  { id: "appearance", label: "Appearance", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20c-2.76 0-5-3.58-5-8s2.24-8 5-8z"/></svg>
  )},
  { id: "system", label: "System", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M21.73 12H19M5 12H2.27M12 2.27V5M12 19v2.73"/></svg>
  )},
  { id: "shortcuts", label: "Shortcuts", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
  )},
  { id: "applications", label: "Applications", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { id: "sessions", label: "Sessions", icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  )},
];

const PANELS: Record<string, React.ReactNode> = {
  credits: <CreditsPanel />,
  profile: <ProfilePanel />,
  appearance: <AppearancePanel />,
  system: <SystemPanel />,
  shortcuts: <ShortcutsPanel />,
  applications: <ApplicationsPanel />,
  sessions: <SessionsPanel />,
};

export function Dashboard() {
  const { setShowDashboard, dashboardPanel, setDashboardPanel } = useDesktopStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 400 }}
      onClick={() => setShowDashboard(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="flex overflow-hidden"
        style={{
          width: 960,
          height: 620,
          background: "rgba(12,12,12,0.82)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Sidebar */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: 248, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "32px 18px" }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 36, padding: "0 8px" }}>
            <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Dashboard</h2>
            <button
              onClick={() => setShowDashboard(false)}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-xs"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setDashboardPanel(item.id)}
                className="w-full flex items-center gap-3 rounded-xl text-sm transition-colors text-left"
                style={{
                  padding: "12px 16px",
                  background: dashboardPanel === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                  color: dashboardPanel === item.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                }}
                onMouseOver={(e) => {
                  if (dashboardPanel !== item.id) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
                onMouseOut={(e) => {
                  if (dashboardPanel !== item.id) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                  }
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "40px 48px" }}>
          {PANELS[dashboardPanel]}
        </div>
      </motion.div>
    </motion.div>
  );
}
