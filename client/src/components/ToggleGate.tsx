import React from "react";
import { useToggles, type SectionKey } from "@/components/emoji/integration/utils";
import { triggerEmoji } from "@/components/emoji/emoji_orchestrator";

type Props = {
  section: SectionKey;
  locale?: string;
  profile?: "visitor"|"investisseur"|"porteur"|"admin";
  children: React.ReactNode;
};

export function ToggleGate({ section, locale="fr-FR", profile="visitor", children }: Props) {
  const { toggles } = useToggles(locale);

  if (!toggles) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3 text-sm text-muted-foreground">Chargement…</span>
      </div>
    );
  }

  const info = toggles[section];
  if (!info) return null;

  if (!info.visible) {
    // On affiche un placeholder OFF et on s'assure d'un emoji statique 🚧 (évite le spam)
    triggerEmoji("category_off_view", { section, profile });
    return (
      <div className="rounded-xl border border-slate-700 p-8 bg-slate-900/40 backdrop-blur-md text-white text-center">
        <div className="text-4xl mb-4">🚧</div>
        <div className="text-xl font-semibold mb-2">Section indisponible</div>
        <p className="text-sm text-gray-400">{info.message || "Catégorie en travaux / en cours."}</p>
      </div>
    );
  }

  return <>{children}</>;
}