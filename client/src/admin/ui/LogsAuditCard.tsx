import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getJSON } from "../utils/api";

export function LogsAuditCard() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    getJSON("/api/admin/logs?limit=10").then(setLogs).catch(() => {});
  }, []);

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">📜 Logs & Audit</h2>
        <Button variant="outline" size="sm" className="border-fuchsia-500/30" data-testid="button-refresh-logs">
          🔄 Actualiser
        </Button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="rounded-lg border border-fuchsia-500/20 p-3 bg-black/40 text-sm" data-testid={`log-entry-${i}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono opacity-70">{log.timestamp || new Date().toISOString()}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {log.level || 'info'}
              </span>
            </div>
            <div className="opacity-90">{log.message || 'No message'}</div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-8 opacity-70">Aucun log récent</div>
        )}
      </div>
    </div>
  );
}
