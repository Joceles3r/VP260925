import React from "react";
// import { triggerEmoji } from "@/emoji/emoji_orchestrator";
import type { SectionKey, PublicToggle } from "./utils";

// Placeholder for triggerEmoji function until emoji_orchestrator is implemented
const triggerEmoji = (event: string, data: any) => {
  console.log(`[EmojiOrchestrator] ${event}:`, data);
};

export function ToggleGate({
  section, 
  toggles, 
  message, 
  children
}: { 
  section: SectionKey; 
  toggles: Record<string,PublicToggle>; 
  message?: string; 
  children: React.ReactNode;
}) {
  const info = toggles?.[section];
  if (!info?.visible) {
    triggerEmoji("category_off_view", { section });
    return (
      <div className="rounded-xl border p-6 bg-neutral-900/40 backdrop-blur-md text-neutral-100" data-testid="toggle-gate-disabled">
        <div className="text-2xl mb-2">?</div>
        <div className="font-semibold mb-1">Section indisponible</div>
        <p className="text-sm opacity-80">{info?.message || message || "Catégorie en travaux / en cours."}</p>
      </div>
    );
  }
  return <>{children}</>;
}