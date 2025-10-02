import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { hasProfile } from "@shared/utils";
import AdminLayout from "../layout/AdminLayout";
import { CategoryTogglesCard } from "../ui/CategoryTogglesCard";
import { ProfileModulesCard } from "../ui/ProfileModulesCard";
import { ThemeDesignerCard } from "../ui/ThemeDesignerCard";
import { AgentsControlCard } from "../ui/AgentsControlCard";
import { SecurityPanel } from "../ui/SecurityPanel";
import { MaintenanceOpsCard } from "../ui/MaintenanceOpsCard";
import { StripeMonitorCard } from "../ui/StripeMonitorCard";
import { LogsAuditCard } from "../ui/LogsAuditCard";
import { UsersManagementCard } from "../ui/UsersManagementCard";
import { ProjectsManagementCard } from "../ui/ProjectsManagementCard";
import { BroadcastNotificationsCard } from "../ui/BroadcastNotificationsCard";
import { PlatformConfigCard } from "../ui/PlatformConfigCard";
import { FinancePreviewCard } from "@/components/admin/FinancePreviewCard";
import { AdminThemeOverride } from "@/components/admin/AdminThemeOverride";
import { getJSON } from "../utils/api";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté pour accéder à cette page",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && isAuthenticated && !hasProfile(user?.profileTypes, 'admin')) {
      toast({
        title: "Accès refusé",
        description: "Privilèges administrateur requis",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);
  
  useEffect(() => {
    if (isAuthenticated && hasProfile(user?.profileTypes, 'admin')) {
      getJSON("/api/admin/overview").then(setOverview).catch(() => {});
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
        <div className="animate-spin w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasProfile(user?.profileTypes, 'admin')) {
    return null;
  }

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

      <div id="users"><UsersManagementCard /></div>
      <div id="projects"><ProjectsManagementCard /></div>
      <div id="broadcast"><BroadcastNotificationsCard /></div>
      <div id="config"><PlatformConfigCard /></div>
      
      <div id="toggles"><CategoryTogglesCard /></div>
      <div id="profiles"><ProfileModulesCard /></div>
      <div id="theme-override"><AdminThemeOverride /></div>
      <div id="theme"><ThemeDesignerCard /></div>
      <div id="agents"><AgentsControlCard /></div>
      <div id="security"><SecurityPanel /></div>
      <div id="ops"><MaintenanceOpsCard /></div>
      <div id="stripe"><StripeMonitorCard /></div>
      <div id="revenue"><FinancePreviewCard /></div>
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
