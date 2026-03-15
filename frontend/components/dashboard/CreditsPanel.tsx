"use client";

const PACKS = [
  { name: "Starter", credits: 800, price: 5, desc: "Perfect for trying out" },
  { name: "Basic", credits: 5000, price: 45, desc: "For regular users" },
  { name: "Professional", credits: 25000, price: 200, desc: "Power users" },
  { name: "Team", credits: 100000, price: 700, desc: "For teams" },
];

export function CreditsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#e8f0ec] mb-1">Credits</h3>
        <p className="text-sm text-[#6b8a7a]">Manage your InfinityOS credits</p>
      </div>

      {/* Balance card */}
      <div
        className="p-5 rounded-2xl flex items-center justify-between"
        style={{ background: "#111a16", border: "1px solid #1f2e28" }}
      >
        <div>
          <p className="text-xs text-[#6b8a7a] uppercase tracking-wider mb-1">Available Credits</p>
          <p className="text-4xl font-bold" style={{ color: "#00c896" }}>284.34</p>
        </div>
        <span className="text-4xl">💳</span>
      </div>

      {/* Packs */}
      <div>
        <p className="text-sm font-medium text-[#e8f0ec] mb-3">Purchase Credits</p>
        <div className="grid grid-cols-2 gap-3">
          {PACKS.map((pack) => (
            <button
              key={pack.name}
              onClick={() => alert("Coming soon!")}
              className="p-4 rounded-xl text-left transition-colors"
              style={{ background: "#111a16", border: "1px solid #1f2e28" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1a2820")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#111a16")}
            >
              <p className="text-xl font-bold" style={{ color: "#00c896" }}>
                {pack.credits.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-[#e8f0ec]">{pack.name}</p>
              <p className="text-xs text-[#6b8a7a]">{pack.desc}</p>
              <p className="text-sm font-semibold text-[#e8f0ec] mt-2">${pack.price}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
