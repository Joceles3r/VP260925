import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postJSON } from "../utils/api";
import { useToast } from "@/hooks/use-toast";

export function MaintenanceOpsCard() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOp = async (op: string, label: string) => {
    setLoading(op);
    try {
      await postJSON(`/api/admin/maintenance/${op}`, {});
      toast({ title: `✅ ${label} effectuée` });
    } catch (error) {
      toast({ title: "❌ Erreur", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">🛠️ Maintenance</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <Button
          onClick={() => handleOp("clear-cache", "Cache nettoyé")}
          disabled={loading === "clear-cache"}
          variant="outline"
          className="border-fuchsia-500/30"
          data-testid="button-clear-cache"
        >
          {loading === "clear-cache" ? "⏳" : "🗑️"} Vider le cache
        </Button>
        <Button
          onClick={() => handleOp("cleanup-logs", "Logs nettoyés")}
          disabled={loading === "cleanup-logs"}
          variant="outline"
          className="border-fuchsia-500/30"
          data-testid="button-cleanup-logs"
        >
          {loading === "cleanup-logs" ? "⏳" : "📜"} Nettoyer les logs
        </Button>
        <Button
          onClick={() => handleOp("optimize-db", "Base optimisée")}
          disabled={loading === "optimize-db"}
          variant="outline"
          className="border-fuchsia-500/30"
          data-testid="button-optimize-db"
        >
          {loading === "optimize-db" ? "⏳" : "💾"} Optimiser la DB
        </Button>
        <Button
          onClick={() => handleOp("backup-db", "Backup créé")}
          disabled={loading === "backup-db"}
          variant="outline"
          className="border-fuchsia-500/30"
          data-testid="button-backup-db"
        >
          {loading === "backup-db" ? "⏳" : "💿"} Backup DB
        </Button>
      </div>
    </div>
  );
}
