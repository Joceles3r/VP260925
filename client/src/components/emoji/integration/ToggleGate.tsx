import React from "react";
import { useToggles, SectionKey } from "./utils";
import { triggerEmoji } from "../emoji_orchestrator";

type Props = {
  section: SectionKey;
  locale?: string;
  profile?: "visitor"|"investisseur"|"porteur"|"admin";
  children: React.ReactNode;
};

export function ToggleGate({ section, locale="fr-FR", profile="visitor", children }: Props) {
  const { toggles } = useToggles(locale);

  if (!toggles) {
    return <div className="text-sm opacity-70 p-4">Chargement…</div>;
  }

  const info = toggles[section];
  if (!info) return null;

  if (!info.visible) {
    // On affiche un placeholder OFF et on s'assure d'un emoji statique 🚧 (évite le spam)
    triggerEmoji("category_off_view", { section, profile });
    return (
      <div className="rounded-xl border p-6 bg-neutral-900/40 backdrop-blur-md text-neutral-100">
        <div className="text-2xl mb-2">🚧</div>
        <div className="font-semibold mb-1">Section indisponible</div>
        <p className="text-sm opacity-80">{info.message || "Catégorie en travaux / en cours."}</p>
      </div>
    );
  }

  return <>{children}</>;
}