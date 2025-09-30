import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON, patchJSON } from "../utils/api";
import { useToast } from "@/hooks/use-toast";

export function ThemeDesignerCard() {
  const [theme, setTheme] = useState<any>({ primaryColor: "#7B2CFF", secondaryColor: "#00D1FF", accentColor: "#FF3CAC" });
  const { toast } = useToast();

  useEffect(() => {
    getJSON("/api/admin/theme").then(setTheme).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await patchJSON("/api/admin/theme", theme);
      toast({ title: "✅ Thème sauvegardé" });
    } catch (error) {
      toast({ title: "❌ Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">🎨 Thème & Interface</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Couleur primaire</label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
              className="w-20 h-10"
              data-testid="input-primary-color"
            />
            <Input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
              className="flex-1"
              data-testid="input-primary-color-text"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-2">Couleur secondaire</label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
              className="w-20 h-10"
              data-testid="input-secondary-color"
            />
            <Input
              type="text"
              value={theme.secondaryColor}
              onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
              className="flex-1"
              data-testid="input-secondary-color-text"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-2">Couleur accent</label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.accentColor}
              onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
              className="w-20 h-10"
              data-testid="input-accent-color"
            />
            <Input
              type="text"
              value={theme.accentColor}
              onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
              className="flex-1"
              data-testid="input-accent-color-text"
            />
          </div>
        </div>
        <Button onClick={handleSave} className="w-full" data-testid="button-save-theme">
          Sauvegarder le thème
        </Button>
      </div>
    </div>
  );
}
