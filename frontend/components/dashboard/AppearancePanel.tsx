"use client";
import { useRef, useState } from "react";

import { useDesktopStore } from "@/store/desktopStore";

const PRESETS = [
  {
    id: "default",
    label: "Default",
    value: null,
    preview: "radial-gradient(ellipse at 50% 60%, #0d3d2e 0%, #061209 60%, #020805 100%)",
  },
  {
    id: "midnight",
    label: "Midnight",
    value: "preset:midnight",
    preview: "radial-gradient(ellipse at 30% 40%, #0d1a3d 0%, #060a12 60%, #020408 100%)",
  },
  {
    id: "dusk",
    label: "Dusk",
    value: "preset:dusk",
    preview: "radial-gradient(ellipse at 60% 30%, #2d1a3d 0%, #12060e 60%, #080208 100%)",
  },
  {
    id: "ember",
    label: "Ember",
    value: "preset:ember",
    preview: "radial-gradient(ellipse at 50% 70%, #3d1a0d 0%, #120806 60%, #080202 100%)",
  },
  {
    id: "slate",
    label: "Slate",
    value: "preset:slate",
    preview: "radial-gradient(ellipse at 50% 50%, #1a1f2e 0%, #0a0c12 60%, #050608 100%)",
  },
  {
    id: "void",
    label: "Void",
    value: "preset:void",
    preview: "#020202",
  },
];

const PRESET_CSS: Record<string, string> = {
  "preset:midnight": "radial-gradient(ellipse at 30% 40%, #0d1a3d 0%, #060a12 60%, #020408 100%)",
  "preset:dusk": "radial-gradient(ellipse at 60% 30%, #2d1a3d 0%, #12060e 60%, #080208 100%)",
  "preset:ember": "radial-gradient(ellipse at 50% 70%, #3d1a0d 0%, #120806 60%, #080202 100%)",
  "preset:slate": "radial-gradient(ellipse at 50% 50%, #1a1f2e 0%, #0a0c12 60%, #050608 100%)",
  "preset:void": "#020202",
};

export function AppearancePanel() {
  const { wallpaper, setWallpaper } = useDesktopStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(wallpaper);

  const isPreset = (w: string | null) => w?.startsWith("preset:") ?? false;
  const isCustomImage = (w: string | null) => w && !isPreset(w);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setWallpaper(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const selectPreset = (value: string | null) => {
    setPreview(value);
    setWallpaper(value);
  };

  const clearWallpaper = () => {
    setPreview(null);
    setWallpaper(null);
  };

  const currentPreviewStyle = (value: string | null): React.CSSProperties => {
    if (!value) return { background: "radial-gradient(ellipse at 50% 60%, #0d3d2e 0%, #061209 60%, #020805 100%)" };
    if (isPreset(value)) return { background: PRESET_CSS[value] };
    return { backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#e8f0ec] mb-1">Appearance</h3>
        <p className="text-sm text-[#6b8a7a]">Customize your desktop wallpaper</p>
      </div>

      {/* Current wallpaper preview */}
      <div>
        <p className="text-xs text-[#6b8a7a] mb-2 uppercase tracking-wide">Preview</p>
        <div
          className="w-full rounded-xl overflow-hidden relative"
          style={{ height: 160, ...currentPreviewStyle(preview) }}
        >
          {/* Simulated topbar overlay */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center px-3 gap-2"
            style={{ height: 32, background: "rgba(10,15,13,0.6)", backdropFilter: "blur(12px)" }}
          >
            <div className="w-5 h-5 rounded-md" style={{ background: "#0d1f19" }} />
            <div className="flex-1 h-4 rounded-full" style={{ background: "rgba(13,24,20,0.7)", border: "1px solid rgba(31,46,40,0.6)" }} />
            <div className="w-5 h-5 rounded-full" style={{ background: "#1a2820" }} />
          </div>
        </div>
      </div>

      {/* Upload */}
      <div>
        <p className="text-xs text-[#6b8a7a] mb-2 uppercase tracking-wide">Custom Image</p>
        <div
          className="relative flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-colors"
          style={{
            height: 100,
            border: `2px dashed ${dragging ? "#00c896" : "#1f2e28"}`,
            background: dragging ? "rgba(0,200,150,0.05)" : "#0a1510",
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d5448" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <p className="text-xs text-[#3d5448]">
            {isCustomImage(preview) ? "Replace image" : "Drop image or click to upload"}
          </p>
          {isCustomImage(preview) && (
            <p className="text-[10px] text-[#00c896]">Custom image active</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      </div>

      {/* Preset gradients */}
      <div>
        <p className="text-xs text-[#6b8a7a] mb-3 uppercase tracking-wide">Presets</p>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const active = preview === p.value || (p.value === null && !preview);
            return (
              <button
                key={p.id}
                onClick={() => selectPreset(p.value)}
                className="relative rounded-xl overflow-hidden transition-all"
                style={{
                  height: 72,
                  background: p.preview,
                  outline: active ? "2px solid #00c896" : "2px solid transparent",
                  outlineOffset: 2,
                }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <span className="text-xs text-[#e8f0ec] font-medium">{p.label}</span>
                </div>
                {active && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#00c896" }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#020805" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear custom */}
      {isCustomImage(preview) && (
        <button
          onClick={clearWallpaper}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
          style={{ background: "#111a16", border: "1px solid #1f2e28", color: "#e05555" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#111a16")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
          Remove custom wallpaper
        </button>
      )}
    </div>
  );
}
