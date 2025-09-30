import { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import { CategoryTogglesCard } from "../ui/CategoryTogglesCard";
import { ProfileModulesCard } from "../ui/ProfileModulesCard";
import { ThemeDesignerCard } from "../ui/ThemeDesignerCard";
import { AgentsControlCard } from "../ui/AgentsControlCard";
import { SecurityPanel } from "../ui/SecurityPanel";
import { MaintenanceOpsCard } from "../ui/MaintenanceOpsCard";
import { StripeMonitorCard } from "../ui/StripeMonitorCard";
import { LogsAuditCard } from "../ui/LogsAuditCard";
import { getJSON } from "../utils/api";

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null);
  
  useEffect(() => {
    getJSON("/api/admin/overview").then(setOverview).catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div id="overview" className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">📊 Vue d'ensemble</h2>
          <div className="text-sm opacity-80" data-testid="text-last-update">
            Dernière MAJ : {overview?.updated_at || "—"}
          </div>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <Stat label="Uptime (jours)" value={overview?.uptime_days ?? "—"} testId="stat-uptime" />
          <Stat label="Utilisateurs (24h)" value={overview?.users_24h ?? "—"} testId="stat-users" />
          <Stat label="Transactions (24h)" value={overview?.tx_24h ?? "—"} testId="stat-transactions" />
        </div>
      </div>

      <div id="toggles"><CategoryTogglesCard /></div>
      <div id="profiles"><ProfileModulesCard /></div>
      <div id="theme"><ThemeDesignerCard /></div>
      <div id="agents"><AgentsControlCard /></div>
      <div id="security"><SecurityPanel /></div>
      <div id="ops"><MaintenanceOpsCard /></div>
      <div id="stripe"><StripeMonitorCard /></div>
      <div id="logs"><LogsAuditCard /></div>
    </AdminLayout>
  );
}

function Stat({ label, value, testId }: { label: string; value: string | number; testId?: string }) {
  return (
    <div className="rounded-xl border border-fuchsia-500/30 p-4 bg-black/40">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1" data-testid={testId}>{value}</div>
    </div>
  );
}
