"use client";
import { useState } from "react";
import { useDesktopStore } from "@/store/desktopStore";

const TIMEZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo", "Asia/Kolkata"];

export function SystemPanel() {
  const { dockPosition, setDockPosition } = useDesktopStore();
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("English");

  const selectStyle = {
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
        <h3 className="text-lg font-semibold text-[#e8f0ec] mb-1">System</h3>
        <p className="text-sm text-[#6b8a7a]">Personalize your desktop</p>
      </div>

      <div>
        <label className="text-xs text-[#6b8a7a] mb-1.5 block">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          style={selectStyle}
        >
          {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-[#6b8a7a] mb-1.5 block">Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
          <option>English</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-[#6b8a7a] mb-3 block">Dock Position</label>
        <div className="grid grid-cols-2 gap-3">
          {(["bottom", "left"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setDockPosition(pos)}
              className="p-4 rounded-xl flex flex-col items-center gap-2 transition-colors capitalize"
              style={{
                background: dockPosition === pos ? "#00c89615" : "#111a16",
                border: `1px solid ${dockPosition === pos ? "#00c896" : "#1f2e28"}`,
                color: dockPosition === pos ? "#00c896" : "#6b8a7a",
              }}
            >
              <span className="text-2xl">{pos === "bottom" ? "⬇️" : "⬅️"}</span>
              <span className="text-sm">{pos}</span>
              {dockPosition === pos && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          className="px-4 py-2 rounded-xl text-sm text-[#6b8a7a]"
          style={{ background: "#111a16", border: "1px solid #1f2e28" }}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium"
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
