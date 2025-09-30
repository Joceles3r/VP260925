import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  isOverridden: boolean;
  isInitialized: boolean;
  setTheme: (theme: Theme) => void;
  setOverride: (override: Theme | null) => void;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "dark",
  isOverridden: false,
  isInitialized: false,
  
  setTheme: (theme: Theme) => {
    const { isOverridden } = get();
    if (isOverridden) return;
    
    set({ theme });
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("visual_theme", theme);
    
    // Also save to server asynchronously
    fetch("/api/user/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
      credentials: "include",
    }).catch(error => {
      console.error("Failed to save theme preference to server:", error);
    });
  },
  
  setOverride: async (override: Theme | null) => {
    if (override) {
      set({ theme: override, isOverridden: true });
      document.documentElement.classList.toggle("dark", override === "dark");
    } else {
      // Override removed, restore user preference
      set({ isOverridden: false });
      
      // Try to get user preference from server
      try {
        const userResponse = await fetch("/api/auth/user", { credentials: "include" });
        if (userResponse.ok) {
          const user = await userResponse.json();
          if (user.themePreference) {
            const theme = user.themePreference as Theme;
            set({ theme });
            document.documentElement.classList.toggle("dark", theme === "dark");
            localStorage.setItem("visual_theme", theme);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user theme after override removal:", error);
      }

      // Fallback to localStorage or system preference
      const saved = (localStorage.getItem("visual_theme") as Theme) 
        || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      set({ theme: saved });
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  },
  
  initialize: async () => {
    console.log("[ThemeStore] Initializing theme...");
    
    // Check admin override first
    try {
      const overrideResponse = await fetch("/api/platform/theme-override");
      if (overrideResponse.ok) {
        const data = await overrideResponse.json();
        console.log("[ThemeStore] Admin override check:", data);
        if (data.override) {
          console.log("[ThemeStore] Admin override active:", data.override);
          set({ 
            theme: data.override, 
            isOverridden: true,
            isInitialized: true 
          });
          document.documentElement.classList.toggle("dark", data.override === "dark");
          console.log("[ThemeStore] Applied override theme, classList:", document.documentElement.classList.toString());
          return;
        }
      }
    } catch (error) {
      console.error("[ThemeStore] Failed to check theme override:", error);
    }

    // Try to get user preference from server
    try {
      const userResponse = await fetch("/api/auth/user", { credentials: "include" });
      console.log("[ThemeStore] User fetch status:", userResponse.status);
      if (userResponse.ok) {
        const user = await userResponse.json();
        console.log("[ThemeStore] User data:", { id: user.id, themePreference: user.themePreference });
        if (user.themePreference) {
          console.log("[ThemeStore] Using user DB preference:", user.themePreference);
          set({ 
            theme: user.themePreference, 
            isInitialized: true 
          });
          const isDark = user.themePreference === "dark";
          document.documentElement.classList.toggle("dark", isDark);
          localStorage.setItem("visual_theme", user.themePreference);
          console.log("[ThemeStore] Applied DB theme, isDark:", isDark, "classList:", document.documentElement.classList.toString());
          return;
        }
      }
    } catch (error) {
      console.error("[ThemeStore] Failed to fetch user theme preference:", error);
    }

    // Fallback to localStorage or system preference
    const saved = (localStorage.getItem("visual_theme") as Theme) 
      || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    
    console.log("[ThemeStore] Fallback theme:", saved);
    set({ theme: saved, isInitialized: true });
    document.documentElement.classList.toggle("dark", saved === "dark");
    console.log("[ThemeStore] Applied fallback theme, classList:", document.documentElement.classList.toString());
  },
}));
