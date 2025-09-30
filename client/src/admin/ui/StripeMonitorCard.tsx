import { useState, useEffect } from "react";
import { getJSON } from "../utils/api";

export function StripeMonitorCard() {
  const [stats, setStats] = useState<any>({ today_revenue: 0, today_transactions: 0, pending_payouts: 0 });

  useEffect(() => {
    getJSON("/api/admin/stripe/stats").then(setStats).catch(() => {});
  }, []);

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">💳 Paiements Stripe</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
          <div className="text-sm opacity-70">Revenus (aujourd'hui)</div>
          <div className="text-2xl font-bold mt-1" data-testid="text-today-revenue">{stats.today_revenue} €</div>
        </div>
        <div className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
          <div className="text-sm opacity-70">Transactions (aujourd'hui)</div>
          <div className="text-2xl font-bold mt-1" data-testid="text-today-transactions">{stats.today_transactions}</div>
        </div>
        <div className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
          <div className="text-sm opacity-70">Payouts en attente</div>
          <div className="text-2xl font-bold mt-1" data-testid="text-pending-payouts">{stats.pending_payouts}</div>
        </div>
      </div>
    </div>
  );
}
