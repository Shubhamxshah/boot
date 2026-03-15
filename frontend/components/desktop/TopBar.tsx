"use client";
import { useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDesktopStore } from "@/store/desktopStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export function TopBar() {
  const { user } = useAuthStore();
  const { setShowDashboard, setDashboardPanel, showUserMenu, setShowUserMenu } = useDesktopStore();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openCredits = () => {
    setDashboardPanel("credits");
    setShowDashboard(true);
  };

  const openDashboard = () => {
    setShowUserMenu(false);
    setDashboardPanel("credits");
    setShowDashboard(true);
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div
      className="fixed top-0 left-0 right-0 flex items-center px-4 gap-3"
      style={{
        height: 52,
        background: "rgba(10, 15, 13, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #1f2e28",
        zIndex: 200,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ background: "#0d1f19", border: "1px solid #1f2e28", color: "#00c896" }}
        >
          ∞
        </div>
        <span className="text-sm font-semibold text-[#e8f0ec]">InfinityOS</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-4 py-1.5 rounded-full text-sm outline-none"
          style={{
            background: "#0d1814",
            border: "1px solid #1f2e28",
            color: "#e8f0ec",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Credits pill */}
        <button
          onClick={openCredits}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{ background: "#0d1814", border: "1px solid #1f2e28", color: "#e8f0ec" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#0d1814")}
        >
          <span>📋</span>
          <span className="text-[#00c896] font-semibold">284</span>
        </button>

        {/* Avatar */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden"
            style={{ background: "#1a2820", border: "2px solid #1f2e28", color: "#00c896" }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-56 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(13, 24, 20, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid #1f2e28",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  zIndex: 400,
                }}
              >
                {/* User info */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0"
                    style={{ background: "#1a2820", color: "#00c896" }}
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#e8f0ec] truncate">{user?.name}</p>
                    <p className="text-xs text-[#6b8a7a] truncate">@{user?.email?.split("@")[0]}</p>
                  </div>
                </div>

                <div className="h-px mx-3" style={{ background: "#1f2e28" }} />

                <button
                  onClick={openDashboard}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8f0ec] transition-colors text-left"
                  onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  ⚙️ Dashboard
                </button>

                <div className="h-px mx-3" style={{ background: "#1f2e28" }} />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                  style={{ color: "#e05555" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  ↪️ Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
