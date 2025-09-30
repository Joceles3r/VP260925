import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON, postJSON } from "../utils/api";
import { useToast } from "@/hooks/use-toast";

export function SecurityPanel() {
  const [securityStats, setSecurityStats] = useState<any>({ failed_logins_24h: 0, blocked_ips: 0 });
  const [blockIp, setBlockIp] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    getJSON("/api/admin/security").then(setSecurityStats).catch(() => {});
  }, []);

  const handleBlockIp = async () => {
    if (!blockIp.trim()) return;
    try {
      await postJSON("/api/admin/security/block-ip", { ip: blockIp });
      toast({ title: "✅ IP bloquée" });
      setBlockIp("");
      getJSON("/api/admin/security").then(setSecurityStats).catch(() => {});
    } catch (error) {
      toast({ title: "❌ Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">🔐 Sécurité</h2>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
            <div className="text-sm opacity-70">Tentatives échouées (24h)</div>
            <div className="text-2xl font-bold mt-1" data-testid="text-failed-logins">{securityStats.failed_logins_24h}</div>
          </div>
          <div className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
            <div className="text-sm opacity-70">IPs bloquées</div>
            <div className="text-2xl font-bold mt-1" data-testid="text-blocked-ips">{securityStats.blocked_ips}</div>
          </div>
        </div>
        <div className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
          <label className="block text-sm mb-2">Bloquer une IP</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="192.168.1.1"
              value={blockIp}
              onChange={(e) => setBlockIp(e.target.value)}
              className="flex-1"
              data-testid="input-block-ip"
            />
            <Button onClick={handleBlockIp} data-testid="button-block-ip">Bloquer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
