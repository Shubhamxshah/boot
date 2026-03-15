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
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Appearance</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Customize your desktop wallpaper</p>
      </div>

      {/* Current wallpaper preview */}
      <div>
        <p className="text-xs mb-3 font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Preview</p>
        <div
          className="w-full rounded-2xl overflow-hidden relative"
          style={{ height: 180, ...currentPreviewStyle(preview) }}
        >
          <div
            className="absolute top-0 left-0 right-0 flex items-center px-3 gap-2"
            style={{ height: 32, background: "rgba(10,15,13,0.6)", backdropFilter: "blur(12px)" }}
          >
            <div className="w-5 h-5 rounded-md" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex-1 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div className="w-5 h-5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>
      </div>

      {/* Upload */}
      <div>
        <p className="text-xs mb-3 font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Custom Image</p>
        <div
          className="relative flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-colors"
          style={{
            height: 120,
            border: `2px dashed ${dragging ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
            background: dragging ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {isCustomImage(preview) ? "Replace image" : "Drop image or click to upload"}
          </p>
          {isCustomImage(preview) && (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Custom image active</p>
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
        <p className="text-xs mb-4 font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Presets</p>
        <div className="grid grid-cols-3 gap-4">
          {PRESETS.map((p) => {
            const active = preview === p.value || (p.value === null && !preview);
            return (
              <button
                key={p.id}
                onClick={() => selectPreset(p.value)}
                className="relative rounded-xl overflow-hidden transition-all"
                style={{
                  height: 88,
                  background: p.preview,
                  outline: active ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
                  outlineOffset: 3,
                }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-2"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{p.label}</span>
                </div>
                {active && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)" }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          className="flex items-center gap-2 rounded-xl text-sm transition-colors"
          style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.15)", color: "rgba(255,120,120,0.9)", padding: "10px 18px" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,80,80,0.15)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,80,80,0.08)")}
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
