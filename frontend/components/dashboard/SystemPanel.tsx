"use client";
import { useState } from "react";
import { useDesktopStore } from "@/store/desktopStore";

const TIMEZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo", "Asia/Kolkata"];

export function SystemPanel() {
  const { dockPosition, setDockPosition } = useDesktopStore();
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("English");

  const selectStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>System</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Personalize your desktop</p>
      </div>

      <div>
        <label className="text-xs mb-2.5 block font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Timezone</label>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={selectStyle}>
          {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs mb-2.5 block font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
          <option>English</option>
        </select>
      </div>

      <div>
        <label className="text-xs mb-4 block font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Dock Position</label>
        <div className="grid grid-cols-2 gap-4">
          {(["bottom", "left"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setDockPosition(pos)}
              className="rounded-2xl flex flex-col items-center transition-colors capitalize"
              style={{
                padding: "28px 20px",
                gap: 12,
                background: dockPosition === pos ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${dockPosition === pos ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                color: dockPosition === pos ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              }}
            >
              <span className="text-3xl">{pos === "bottom" ? "⬇️" : "⬅️"}</span>
              <span className="text-sm font-medium">{pos.charAt(0).toUpperCase() + pos.slice(1)}</span>
              {dockPosition === pos && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3" style={{ paddingTop: 8 }}>
        <button
          className="rounded-xl text-sm transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "10px 20px" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        >
          Cancel
        </button>
        <button
          className="rounded-xl text-sm font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", padding: "10px 24px" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        >
          Save
        </button>
      </div>
    </div>
  );
}
