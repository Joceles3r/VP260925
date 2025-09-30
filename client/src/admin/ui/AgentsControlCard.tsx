import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getJSON, patchJSON } from "../utils/api";
import { useToast } from "@/hooks/use-toast";

export function AgentsControlCard() {
  const [agents, setAgents] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getJSON("/api/admin/agents").then(setAgents).catch(() => {});
  }, []);

  const handleToggle = async (agentId: string, enabled: boolean) => {
    try {
      await patchJSON(`/api/admin/agents/${agentId}`, { enabled });
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, enabled } : a));
      toast({ title: enabled ? "✅ Agent activé" : "⏸️ Agent désactivé" });
    } catch (error) {
      toast({ title: "❌ Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">🤖 Agents IA</h2>
      <div className="space-y-3">
        {agents.map(agent => (
          <div key={agent.id} className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{agent.name}</div>
              <Switch
                checked={agent.enabled}
                onCheckedChange={(checked) => handleToggle(agent.id, checked)}
                data-testid={`toggle-agent-${agent.id}`}
              />
            </div>
            <div className="text-sm opacity-70">{agent.description}</div>
            <div className="mt-2 text-xs opacity-50">
              Status: <span className={agent.enabled ? "text-green-400" : "text-gray-400"}>
                {agent.enabled ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-8 opacity-70">Aucun agent configuré</div>
        )}
      </div>
    </div>
  );
}
