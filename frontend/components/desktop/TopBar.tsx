"use client";
import { useRef, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDesktopStore } from "@/store/desktopStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import { billingApi } from "@/lib/api/billing";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

type AuthView = "welcome" | "signin" | "register";

const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors";
const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ffffff",
};

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const BackArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M5 12l7 7M5 12l7-7" />
  </svg>
);

function SignInForm({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
          <BackArrow />
        </button>
        <h3 className="text-sm font-semibold" style={{ color: "#ffffff" }}>Sign In</h3>
      </div>

      <a
        href={authApi.googleLoginUrl()}
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-medium transition-all"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff" }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        <GoogleIcon /> Continue with Google
      </a>

      <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        or
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        <input
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        {error && <p className="text-[#ff6b6b] text-xs">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff" }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        No account?{" "}
        <button onClick={onSwitch} className="hover:underline" style={{ color: "rgba(255,255,255,0.8)" }}>Create one</button>
      </p>
    </div>
  );
}

function RegisterForm({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
          <BackArrow />
        </button>
        <h3 className="text-sm font-semibold" style={{ color: "#ffffff" }}>Create Account</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        <input
          type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        {error && <p className="text-[#ff6b6b] text-xs">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff" }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        Have an account?{" "}
        <button onClick={onSwitch} className="hover:underline" style={{ color: "rgba(255,255,255,0.8)" }}>Sign in</button>
      </p>
    </div>
  );
}

export function TopBar() {
  const { user, isAuthenticated } = useAuthStore();
  const { setShowDashboard, setDashboardPanel, showUserMenu, setShowUserMenu, showAuthPopup, setShowAuthPopup } = useDesktopStore();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [authView, setAuthView] = useState<AuthView>("welcome");

  const { data: creditsData } = useQuery({
    queryKey: ["credits"],
    queryFn: () => billingApi.getBalance(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      setAuthView("welcome");
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowAuthPopup(false);
        setAuthView("welcome");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      const next = !showAuthPopup;
      setShowAuthPopup(next);
      if (next) setAuthView("welcome");
    }
  };

  const openDashboard = () => {
    setShowUserMenu(false);
    setDashboardPanel("credits");
    setShowDashboard(true);
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="fixed top-0 left-0 right-0 z-200">
      {/* Search bar + avatar — centered row */}
      <div className="flex justify-center items-center" style={{ paddingTop: 62 }}>
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

        {/* Avatar — 1cm to the right of search bar */}
        <div className="relative shrink-0 " ref={menuRef} style={{ marginLeft: 16 }}>
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
                className="absolute right-0 top-12 w-80 rounded-2xl"
                style={{
                  background: "rgba(10,10,10,0.72)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                  zIndex: 400,
                  padding: "28px 28px",
                }}
              >
                <AnimatePresence mode="wait">
                  {authView === "welcome" && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.12 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="mb-6">
                        <h3 className="text-base font-semibold" style={{ color: "#ffffff", marginBottom: 5 }}>Welcome to bootx</h3>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Sign in to sync your workspace across devices</p>
                      </div>

                      <button
                        onClick={() => setAuthView("signin")}
                        className="block rounded-xl text-sm font-semibold text-center transition-all"
                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", color: "#ffffff", padding: "12px 16px", marginLeft: 12, marginRight: 12 }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                      >
                        Sign In
                      </button>

                      <button
                        onClick={() => setAuthView("register")}
                        className="block rounded-xl text-sm font-semibold text-center transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", padding: "12px 16px", marginLeft: 12, marginRight: 12 }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                      >
                        Create Account
                      </button>

                      <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)", margin: "2px 0" }}>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                        or continue with
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                      </div>

                      <a
                        href={authApi.googleLoginUrl()}
                        className="flex items-center justify-center gap-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", padding: "12px 16px", marginLeft: 12, marginRight: 12 }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                      >
                        <GoogleIcon /> Google
                      </a>
                    </motion.div>
                  )}

                  {authView === "signin" && (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.12 }}
                    >
                      <SignInForm
                        onBack={() => setAuthView("welcome")}
                        onSwitch={() => setAuthView("register")}
                      />
                    </motion.div>
                  )}

                  {authView === "register" && (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.12 }}
                    >
                      <RegisterForm
                        onBack={() => setAuthView("welcome")}
                        onSwitch={() => setAuthView("signin")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
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
