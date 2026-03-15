"use client";

const PACKS = [
  { name: "Starter", credits: 800, price: 5, desc: "Perfect for trying out" },
  { name: "Basic", credits: 5000, price: 45, desc: "For regular users" },
  { name: "Professional", credits: 25000, price: 200, desc: "Power users" },
  { name: "Team", credits: 100000, price: 700, desc: "For teams" },
];

export function CreditsPanel() {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Credits</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your InfinityOS credits</p>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "24px 28px" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Available Credits</p>
          <p className="text-5xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>284.34</p>
        </div>
        <div className="w-14 h-9 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }} />
      </div>

      {/* Packs */}
      <div>
        <p className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Purchase Credits</p>
        <div className="grid grid-cols-2 gap-4">
          {PACKS.map((pack) => (
            <button
              key={pack.name}
              onClick={() => alert("Coming soon!")}
              className="rounded-xl text-left transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "20px 22px" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            >
              <p className="text-2xl font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>
                {pack.credits.toLocaleString()}
              </p>
              <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{pack.name}</p>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>{pack.desc}</p>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>${pack.price}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
