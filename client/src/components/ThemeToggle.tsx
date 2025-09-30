import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ThemeToggleProps {
  showLabel?: boolean;
  saveToServer?: boolean;
}

export function ThemeToggle({ showLabel = false, saveToServer = true }: ThemeToggleProps) {
  const { theme, setTheme, isOverridden } = useTheme();
  const { toast } = useToast();

  const toggleTheme = () => {
    if (isOverridden) {
      toast({
        title: "Thème verrouillé",
        description: "Un administrateur a forcé le thème actuel",
        variant: "destructive",
      });
      return;
    }

    const newTheme = theme === "dark" ? "light" : "dark";
    // setTheme now handles both localStorage and server persistence
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={toggleTheme}
      className={`gap-2 ${isOverridden ? "opacity-50 cursor-not-allowed" : ""}`}
      data-testid="button-theme-toggle"
      title={isOverridden ? "Thème verrouillé par admin" : `Basculer vers ${theme === "dark" ? "mode clair" : "mode sombre"}`}
    >
      {theme === "dark" ? (
        <>
          <Moon className="h-5 w-5" />
          {showLabel && <span>Mode sombre</span>}
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          {showLabel && <span>Mode clair</span>}
        </>
      )}
    </Button>
  );
}
