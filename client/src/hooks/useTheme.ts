import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function useTheme() {
  const { theme, isOverridden, isInitialized, setTheme, initialize } = useThemeStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return { 
    theme, 
    setTheme, 
    isOverridden 
  };
}
