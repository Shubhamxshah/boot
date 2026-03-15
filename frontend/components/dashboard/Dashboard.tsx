"use client";
import { motion } from "framer-motion";
import { useDesktopStore } from "@/store/desktopStore";
import { CreditsPanel } from "./CreditsPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SystemPanel } from "./SystemPanel";
import { ShortcutsPanel } from "./ShortcutsPanel";
import { ApplicationsPanel } from "./ApplicationsPanel";
import { SessionsPanel } from "./SessionsPanel";

const NAV = [
  { id: "credits", label: "Credits", icon: "💳" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "system", label: "System", icon: "⚙️" },
  { id: "shortcuts", label: "Shortcuts", icon: "⌨️" },
  { id: "applications", label: "Applications", icon: "📦" },
  { id: "sessions", label: "Sessions", icon: "🖥️" },
];

const PANELS: Record<string, React.ReactNode> = {
  credits: <CreditsPanel />,
  profile: <ProfilePanel />,
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
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 400 }}
      onClick={() => setShowDashboard(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="flex overflow-hidden"
        style={{
          width: 900,
          height: 580,
          background: "#0d1814",
          border: "1px solid #1f2e28",
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Sidebar */}
        <div
          className="flex flex-col p-4 shrink-0"
          style={{ width: 240, borderRight: "1px solid #1f2e28" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-[#e8f0ec]">Dashboard</h2>
            <button
              onClick={() => setShowDashboard(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b8a7a] hover:text-[#e8f0ec] transition-colors"
              style={{ background: "#111a16" }}
            >
              ✕
            </button>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setDashboardPanel(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left"
                style={{
                  background: dashboardPanel === item.id ? "#00c89620" : "transparent",
                  color: dashboardPanel === item.id ? "#00c896" : "#6b8a7a",
                  border: dashboardPanel === item.id ? "1px solid #00c89640" : "1px solid transparent",
                }}
                onMouseOver={(e) => {
                  if (dashboardPanel !== item.id) {
                    e.currentTarget.style.background = "#111a16";
                    e.currentTarget.style.color = "#e8f0ec";
                  }
                }}
                onMouseOut={(e) => {
                  if (dashboardPanel !== item.id) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#6b8a7a";
                  }
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {PANELS[dashboardPanel]}
        </div>
      </motion.div>
    </motion.div>
  );
}
