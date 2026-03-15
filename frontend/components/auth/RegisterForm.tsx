"use client";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
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

  const inputStyle = {
    background: "#0d1814",
    border: "1px solid #1f2e28",
    color: "#e8f0ec",
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
        />

        {error && <p className="text-[#e05555] text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: "#00c896", color: "#020805" }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#00b585")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#00c896")}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-[#6b8a7a]">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-[#00c896] hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
}
