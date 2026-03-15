"use client";
import { useRef, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDesktopStore } from "@/store/desktopStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import { motion, AnimatePresence } from "framer-motion";

type AuthView = "welcome" | "signin" | "register";

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors";
const inputStyle = { background: "#0a1510", border: "1px solid #1f2e28", color: "#e8f0ec" };

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
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-[#6b8a7a] hover:text-[#e8f0ec] transition-colors">
          <BackArrow />
        </button>
        <h3 className="text-sm font-semibold text-[#e8f0ec]">Sign In</h3>
      </div>

      <a
        href={authApi.googleLoginUrl()}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ background: "rgba(31,46,40,0.5)", border: "1px solid #1f2e28", color: "#e8f0ec" }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(31,46,40,0.8)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "rgba(31,46,40,0.5)")}
      >
        <GoogleIcon /> Continue with Google
      </a>

      <div className="flex items-center gap-2 text-[10px] text-[#3d5448]">
        <div className="flex-1 h-px" style={{ background: "#1f2e28" }} />
        or
        <div className="flex-1 h-px" style={{ background: "#1f2e28" }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        <input
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        {error && <p className="text-[#e05555] text-xs">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          style={{ background: "#00c896", color: "#020805" }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#00b585")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#00c896")}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-[#6b8a7a]">
        No account?{" "}
        <button onClick={onSwitch} className="text-[#00c896] hover:underline">Create one</button>
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-[#6b8a7a] hover:text-[#e8f0ec] transition-colors">
          <BackArrow />
        </button>
        <h3 className="text-sm font-semibold text-[#e8f0ec]">Create Account</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        <input
          type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required
          className={inputCls} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        {error && <p className="text-[#e05555] text-xs">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          style={{ background: "#00c896", color: "#020805" }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#00b585")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#00c896")}
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs text-[#6b8a7a]">
        Have an account?{" "}
        <button onClick={onSwitch} className="text-[#00c896] hover:underline">Sign in</button>
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

  // Auto-show welcome popup for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      setAuthView("welcome");
    }
  }, []);

  // Close on outside click
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
    <div
      className="fixed top-0 left-0 right-0 flex items-center px-4 gap-3"
      style={{ height: 52, background: "rgba(10,15,13,0.7)", backdropFilter: "blur(24px)", zIndex: 200 }}
    >
      {/* Logo */}
      <div className="shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{ background: "#0d1f19", border: "1px solid #1f2e28", color: "#00c896" }}
        >
          ∞
        </div>
      </div>

      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-5 py-2 rounded-full text-sm outline-none"
          style={{ background: "rgba(13,24,20,0.8)", border: "1px solid rgba(31,46,40,0.9)", color: "#e8f0ec" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(31,46,40,0.9)")}
        />
      </div>

      {/* Avatar */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={handleAvatarClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden"
          style={{ background: "#1a2820", border: "2px solid #1f2e28", color: "#6b8a7a" }}
        >
          {isAuthenticated && user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : isAuthenticated ? (
            <span style={{ color: "#00c896" }}>{initials}</span>
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
              className="absolute right-0 top-12 w-72 rounded-2xl p-5"
              style={{
                background: "rgba(13,24,20,0.97)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(31,46,40,0.9)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                zIndex: 400,
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
                    className="space-y-2.5"
                  >
                    <h3 className="text-base font-semibold text-[#e8f0ec] mb-1">Welcome to Infinity</h3>
                    <p className="text-xs text-[#6b8a7a] mb-4">Sign in to sync your workspace across devices</p>

                    <button
                      onClick={() => setAuthView("signin")}
                      className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors"
                      style={{ background: "#0d1f19", border: "1px solid #1f2e28", color: "#e8f0ec" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#132b1f")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "#0d1f19")}
                    >
                      Sign In
                    </button>

                    <button
                      onClick={() => setAuthView("register")}
                      className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors"
                      style={{ background: "rgba(31,46,40,0.45)", border: "1px solid #1f2e28", color: "#e8f0ec" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "rgba(31,46,40,0.7)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "rgba(31,46,40,0.45)")}
                    >
                      Create Account
                    </button>

                    <div className="flex items-center gap-2 text-[10px] text-[#3d5448] py-0.5">
                      <div className="flex-1 h-px" style={{ background: "#1f2e28" }} />
                      or continue with
                      <div className="flex-1 h-px" style={{ background: "#1f2e28" }} />
                    </div>

                    <a
                      href={authApi.googleLoginUrl()}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: "rgba(31,46,40,0.45)", border: "1px solid #1f2e28", color: "#e8f0ec" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "rgba(31,46,40,0.7)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "rgba(31,46,40,0.45)")}
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
              className="absolute right-0 top-12 w-56 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,24,20,0.97)",
                backdropFilter: "blur(24px)",
                border: "1px solid #1f2e28",
                boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                zIndex: 400,
              }}
            >
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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8f0ec] text-left"
                onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M21.73 12H19M5 12H2.27M12 2.27V5M12 19v2.73" />
                </svg>
                Dashboard
              </button>

              <div className="h-px mx-3" style={{ background: "#1f2e28" }} />

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left"
                style={{ color: "#e05555" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
