import React from "react";

// Placeholder for triggerEmoji function until emoji_orchestrator is implemented
const triggerEmoji = (event: string, data: any) => {
  console.log(`[EmojiOrchestrator] ${event}:`, data);
};

export const DockCuriosite = () => (
  <button
    className="neon-glow rounded-full px-4 py-2 text-sm font-semibold bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-400/40"
    onClick={(e) => triggerEmoji("announcement_new", {x: e.clientX, y: e.clientY})}
    data-testid="dock-curiosite"
  >
    ✨ Surprends-moi
  </button>
);