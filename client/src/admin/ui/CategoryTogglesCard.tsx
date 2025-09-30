import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { getJSON, patchJSON } from "../utils/api";
import { useToast } from "@/hooks/use-toast";

export function CategoryTogglesCard() {
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getJSON("/api/admin/categories").then(setCategories).catch(() => {});
  }, []);

  const handleToggle = async (categoryId: string, enabled: boolean) => {
    try {
      await patchJSON(`/api/admin/categories/${categoryId}`, { enabled });
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, enabled } : c));
      toast({ title: "✅ Catégorie mise à jour" });
    } catch (error) {
      toast({ title: "❌ Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 p-5 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4">🗂️ Catégories & Rubriques</h2>
      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between rounded-xl border border-fuchsia-500/20 p-4 bg-black/40">
            <div>
              <div className="font-medium">{cat.name}</div>
              <div className="text-sm opacity-70">{cat.description}</div>
            </div>
            <Switch
              checked={cat.enabled}
              onCheckedChange={(checked) => handleToggle(cat.id, checked)}
              data-testid={`toggle-category-${cat.id}`}
            />
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 opacity-70">Aucune catégorie configurée</div>
        )}
      </div>
    </div>
  );
}
