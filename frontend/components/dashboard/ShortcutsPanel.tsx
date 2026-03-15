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
      className="px-2.5 py-1 rounded-md text-xs font-mono"
      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {children}
    </span>
  );
}

export function ShortcutsPanel() {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Shortcuts</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Keyboard shortcuts reference</p>
      </div>

      {SHORTCUTS.map((group) => (
        <div key={group.section}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>
            {group.section}
          </p>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px" }}
              >
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{item.label}</span>
                <div className="flex items-center gap-1.5">
                  {item.keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <Key>{k}</Key>
                      {i < item.keys.length - 1 && (
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
