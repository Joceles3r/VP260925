import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, X } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

export function AdminThemeOverride() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const setOverride = useThemeStore((state) => state.setOverride);

  const setThemeOverride = async (theme: "light" | "dark" | null) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/theme-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to set theme override");
      }

      // Update the global store immediately
      setOverride(theme);

      toast({
        title: theme ? "Thème global forcé" : "Override désactivé",
        description: theme 
          ? `Tous les utilisateurs verront le thème ${theme === "dark" ? "sombre" : "clair"}`
          : "Les utilisateurs utilisent leur préférence personnelle",
      });
    } catch (error) {
      console.error("Theme override error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de définir l'override de thème",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-[#00D1FF]/30">
      <CardHeader>
        <CardTitle className="visual-text-gradient">🎨 Override Thème Global</CardTitle>
        <CardDescription>
          Forcer un thème pour tous les utilisateurs (ex: mode sombre pendant un Live)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setThemeOverride("dark")}
            disabled={loading}
            className="bg-gradient-to-r from-[#000000] to-[#1a1a1a] hover:from-[#1a1a1a] hover:to-[#333333]"
            data-testid="button-force-dark"
          >
            <Moon className="h-4 w-4 mr-2" />
            Forcer Mode Sombre
          </Button>
          
          <Button
            onClick={() => setThemeOverride("light")}
            disabled={loading}
            className="bg-gradient-to-r from-[#ffffff] to-[#f0f0f0] text-black hover:from-[#f0f0f0] hover:to-[#e0e0e0]"
            data-testid="button-force-light"
          >
            <Sun className="h-4 w-4 mr-2" />
            Forcer Mode Clair
          </Button>
          
          <Button
            onClick={() => setThemeOverride(null)}
            disabled={loading}
            variant="outline"
            className="border-[#FF3CAC]/30"
            data-testid="button-remove-override"
          >
            <X className="h-4 w-4 mr-2" />
            Désactiver Override
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          ⚠️ L'override s'applique immédiatement à tous les utilisateurs connectés
        </p>
      </CardContent>
    </Card>
  );
}
