import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { getJSON, patchJSON } from "../utils/api";
import { useToast } from "@/hooks/use-toast";

export function ProfileModulesCard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getJSON("/api/admin/profiles").then(setProfiles).catch(() => {});
  }, []);

  const handleToggle = async (profileId: string, moduleId: string, enabled: boolean) => {
    try {
      await patchJSON(`/api/admin/profiles/${profileId}/modules/${moduleId}`, { enabled });
      setProfiles(prev => prev.map(p => {
        if (p.id === profileId) {
          return { ...p, modules: p.modules.map((m: any) => m.id === moduleId ? { ...m, enabled } : m) };
        }
        return p;
      }));
      toast({ title: "✅ Module mis à jour" });
    } catch (error) {
      toast({ title: "❌ Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">👥 Modules par profil</h2>
      <div className="space-y-4">
        {profiles.map(profile => (
          <div key={profile.id} className="rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
            <h3 className="font-semibold mb-3">{profile.name}</h3>
            <div className="space-y-2">
              {profile.modules?.map((module: any) => (
                <div key={module.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{module.name}</span>
                  <Switch
                    checked={module.enabled}
                    onCheckedChange={(checked) => handleToggle(profile.id, module.id, checked)}
                    data-testid={`toggle-module-${profile.id}-${module.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-center py-8 opacity-70">Aucun profil configuré</div>
        )}
      </div>
    </div>
  );
}
