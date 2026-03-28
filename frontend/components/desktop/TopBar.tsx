"use client";
import { useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDesktopStore } from "@/store/desktopStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import { billingApi } from "@/lib/api/billing";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/Logo";

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export function TopBar() {
  const { user, isAuthenticated } = useAuthStore();
  const { setShowDashboard, setDashboardPanel, showUserMenu, setShowUserMenu, showAuthPopup, setShowAuthPopup } = useDesktopStore();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: creditsData } = useQuery({
    queryKey: ["credits"],
    queryFn: () => billingApi.getBalance(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowAuthPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      setShowAuthPopup(!showAuthPopup);
    }
  };

  const openDashboard = () => {
    setShowUserMenu(false);
    setDashboardPanel("credits");
    setShowDashboard(true);
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] pointer-events-none">
      <div className="flex justify-center items-center pointer-events-auto" style={{ paddingTop: 62 }}>
        <div
          className="flex items-center rounded-full overflow-hidden"
          style={{
            width: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(16px)",
          }}
        >
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#ffffff", height: 40, paddingLeft: 20, paddingRight: 20 }}
          />
        </div>

        <div className="relative shrink-0" ref={menuRef} style={{ marginLeft: 16 }}>
          <button
            onClick={handleAvatarClick}
            className="w-9 h-9 rounded-full relative flex items-center justify-center text-sm font-semibold overflow-hidden transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            {isAuthenticated ? (
              <>
                <span style={{ color: "#ffffff" }}>{initials}</span>
                {user?.avatar_url && (
                  <img src={user.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                )}
              </>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>

          <AnimatePresence mode="wait">
            {/* ── Auth popup (unauthenticated) ── */}
            {!isAuthenticated && showAuthPopup && (
              <motion.div
                key="auth-popup"
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-14 rounded-2xl"
                style={{
                  width: 320,
                  background: "rgba(16,16,18,0.88)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset",
                  zIndex: 400,
                  padding: "28px 28px 24px",
                }}
              >
                {/* Brand mark */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <LogoMark size={24} />
                    <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "-0.02em" }}>bootx</span>
                  </div>
                  <p style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9375rem", marginBottom: 4 }}>Sign in to continue</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", lineHeight: 1.5 }}>Access your GPU workstation from anywhere.</p>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />

                <a
                  href={authApi.googleLoginUrl()}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    width: "100%", padding: "11px 16px", borderRadius: 10,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#ffffff", fontSize: "0.875rem", fontWeight: 500,
                    textDecoration: "none", transition: "background 0.15s, border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  <GoogleIcon /> Continue with Google
                </a>
              </motion.div>
            )}

            {/* ── User menu (authenticated) ── */}
            {isAuthenticated && showUserMenu && (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-64 rounded-2xl"
                style={{
                  background: "rgba(10,10,10,0.72)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                  zIndex: 400,
                }}
              >
                <div className="flex flex-col items-center" style={{ padding: "20px 20px 16px 20px", gap: 10 }}>
                  <div
                    className="w-11 h-11 rounded-full relative flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff" }}
                  >
                    {initials}
                    {user?.avatar_url && (
                      <img src={user.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    )}
                  </div>
                  <div className="text-center min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>{user?.name}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>@{user?.email?.split("@")[0]}</p>
                    {creditsData !== undefined && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: "rgba(0,200,150,0.8)" }}>
                        {creditsData.balance.toLocaleString()} credits
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.08)", marginBottom: 4 }} />

                <div style={{ padding: "8px 0 12px 0" }}>
                  <button
                    onClick={openDashboard}
                    className="flex items-center gap-3 text-sm text-left transition-colors rounded-xl"
                    style={{ color: "rgba(255,255,255,0.85)", margin: "0 10px", padding: "10px 12px", width: "calc(100% - 20px)" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M21.73 12H19M5 12H2.27M12 2.27V5M12 19v2.73" />
                    </svg>
                    Dashboard
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center gap-3 text-sm text-left transition-colors rounded-xl"
                    style={{ color: "rgba(255,100,100,0.9)", margin: "0 10px", padding: "10px 12px", width: "calc(100% - 20px)" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
