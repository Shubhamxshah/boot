"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function ProfilePanel() {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");

  const inputStyle = {
    background: "#111a16",
    border: "1px solid #1f2e28",
    color: "#e8f0ec",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#e8f0ec] mb-1">Profile</h3>
        <p className="text-sm text-[#6b8a7a]">Manage your account details</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden"
            style={{ background: "#1a2820", border: "2px solid #1f2e28", color: "#00c896" }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)
            )}
          </div>
          <button
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: "#00c896", color: "#020805" }}
          >
            📷
          </button>
        </div>
        <p className="text-sm text-[#6b8a7a]">@{user?.email?.split("@")[0]}</p>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#6b8a7a] mb-1.5 block">First Name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
          />
        </div>
        <div>
          <label className="text-xs text-[#6b8a7a] mb-1.5 block">Last Name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#00c896")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1f2e28")}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="text-xs text-[#6b8a7a] mb-1.5 block">Email</label>
        <input
          value={user?.email || ""}
          disabled
          style={{ ...inputStyle, background: "#0a0f0d", color: "#3d5448" }}
        />
      </div>

      {/* Connected accounts */}
      <div>
        <p className="text-xs text-[#6b8a7a] mb-2">Connected Accounts</p>
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "#111a16", border: "1px solid #1f2e28" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🔗</span>
            <span className="text-sm text-[#e8f0ec]">Google</span>
          </div>
          {user?.auth_provider === "google" && (
            <span className="text-[#00c896] text-lg">✓</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          className="px-4 py-2 rounded-xl text-sm text-[#6b8a7a] transition-colors"
          style={{ background: "#111a16", border: "1px solid #1f2e28" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#111a16")}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "#00c896", color: "#020805" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#00b585")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#00c896")}
        >
          Save
        </button>
      </div>
    </div>
  );
}
