"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingApi } from "@/lib/api/billing";
import type { CreditTransaction } from "@/types";

// Declare Razorpay global (loaded via Script in layout.tsx)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void };
  }
}

const PACKS = [
  { id: "starter", name: "Starter", credits: 500, price: 5, desc: "Perfect for trying out" },
  { id: "professional", name: "Professional", credits: 2000, price: 20, desc: "For regular users" },
  { id: "team", name: "Team", credits: 7000, price: 70, desc: "For teams" },
];

function TransactionRow({ tx }: { tx: CreditTransaction }) {
  const isDebit = tx.amount < 0;
  const label = tx.type === "session_usage" ? "Session usage" : tx.type === "purchase" ? "Purchase" : "Bonus";
  const date = new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{date}</p>
      </div>
      <span className="text-sm font-semibold" style={{ color: isDebit ? "rgba(255,100,100,0.9)" : "rgba(100,255,180,0.9)" }}>
        {isDebit ? "" : "+"}{tx.amount}
      </span>
    </div>
  );
}

export function CreditsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: () => billingApi.getBalance(),
    refetchInterval: 30_000,
  });

  const createOrderMutation = useMutation({
    mutationFn: (packId: string) => billingApi.createOrder(packId),
  });

  const verifyMutation = useMutation({
    mutationFn: (args: { orderId: string; paymentId: string; signature: string }) =>
      billingApi.verifyPayment(args.orderId, args.paymentId, args.signature),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
  });

  const handlePurchase = async (packId: string, packName: string) => {
    try {
      const order = await createOrderMutation.mutateAsync(packId);

      const rzp = new window.Razorpay({
        key: order.razorpay_key_id,
        order_id: order.order_id,
        amount: order.amount_cents * 100,
        currency: "INR",
        name: "bootx",
        description: `${packName} credit pack`,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await verifyMutation.mutateAsync({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        theme: { color: "#00c896" },
      });
      rzp.open();
    } catch (err) {
      console.error("Purchase failed", err);
    }
  };

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Credits</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your bootx credits</p>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "24px 28px" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Available Credits</p>
          {isLoading ? (
            <div className="w-24 h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
          ) : (
            <p className="text-5xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{balance.toLocaleString()}</p>
          )}
        </div>
        <div className="w-14 h-9 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }} />
      </div>

      {/* Packs */}
      <div>
        <p className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Purchase Credits</p>
        <div className="grid grid-cols-2 gap-4">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePurchase(pack.id, pack.name)}
              disabled={createOrderMutation.isPending}
              className="rounded-xl text-left transition-colors disabled:opacity-60"
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

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>Recent Transactions</p>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "4px 16px" }}>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
