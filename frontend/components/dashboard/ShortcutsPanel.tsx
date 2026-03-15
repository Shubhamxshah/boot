"use client";

const SHORTCUTS = [
  {
    section: "Apps & Launcher",
    items: [
      { label: "App Drawer", keys: ["Ctrl", "Alt", "A"] },
      { label: "Search", keys: ["Ctrl", "Alt", "K"] },
    ],
  },
  {
    section: "Window Management",
    items: [
      { label: "Close Window", keys: ["Ctrl", "Alt", "W"] },
      { label: "Minimize", keys: ["Ctrl", "Alt", "M"] },
      { label: "Maximize", keys: ["Ctrl", "Alt", "F"] },
    ],
  },
];

function Key({ children }: { children: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-mono"
      style={{ background: "#1f2e28", color: "#e8f0ec", border: "1px solid #2a3f38" }}
    >
      {children}
    </span>
  );
}

export function ShortcutsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#e8f0ec] mb-1">Shortcuts</h3>
        <p className="text-sm text-[#6b8a7a]">Keyboard shortcuts reference</p>
      </div>

      {SHORTCUTS.map((group) => (
        <div key={group.section}>
          <p className="text-xs font-medium text-[#6b8a7a] uppercase tracking-wider mb-3">
            {group.section}
          </p>
          <div className="space-y-2">
            {group.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "#111a16", border: "1px solid #1f2e28" }}
              >
                <span className="text-sm text-[#e8f0ec]">{item.label}</span>
                <div className="flex items-center gap-1">
                  {item.keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1">
                      <Key>{k}</Key>
                      {i < item.keys.length - 1 && (
                        <span className="text-[#3d5448] text-xs">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        className="px-4 py-2 rounded-xl text-sm text-[#6b8a7a]"
        style={{ background: "#111a16", border: "1px solid #1f2e28" }}
      >
        Cancel
      </button>
    </div>
  );
}
