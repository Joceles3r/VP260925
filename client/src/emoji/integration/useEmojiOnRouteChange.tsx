import { useEffect } from "react";
import { useLocation } from "wouter";
// import { triggerEmoji } from "@/emoji/emoji_orchestrator";
import { sectionFromPath, type SectionKey } from "./utils";

// Placeholder for triggerEmoji function until emoji_orchestrator is implemented
const triggerEmoji = (event: string, data: any) => {
  console.log(`[EmojiOrchestrator] ${event}:`, data);
};

export function useEmojiOnRouteChange(
  profile: "visitor"|"investisseur"|"porteur"|"admin"="visitor"
) {
  const [location] = useLocation();
  
  useEffect(() => {
    const pathname = location || "/";
    // Appel léger : si OFF côté backend, tu peux tirer "category_off_view"
    const section = sectionFromPath(pathname);
    if (section) {
      triggerEmoji("category_open", { section, profile });
    }
  }, [location, profile]);
}