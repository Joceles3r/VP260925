import { useEffect, useState } from "react";
import { triggerEmoji } from "../emoji_orchestrator";

// Les clés doivent correspondre à celles de VISUAL_CONSTANTS.featureKeys
export type SectionKey =
  | "films"
  | "videos"
  | "documentaires"
  | "voix_info"
  | "live_show"
  | "livres"
  | "petites_annonces";

export type PublicToggle = { visible: boolean; message: string };
export type ToggleMap = Record<SectionKey, PublicToggle>;

export function sectionFromPath(pathname: string): SectionKey | null {
  const p = pathname.toLowerCase();
  if (p.startsWith("/films")) return "films";
  if (p.startsWith("/videos")) return "videos";
  if (p.startsWith("/documentaires") || p.startsWith("/docs")) return "documentaires";
  if (p.startsWith("/voix-info") || p.startsWith("/les-voix-de-l-info")) return "voix_info";
  if (p.startsWith("/live") || p.startsWith("/live-show")) return "live_show";
  if (p.startsWith("/livres") || p.startsWith("/books")) return "livres";
  if (p.startsWith("/petites-annonces") || p.startsWith("/classifieds")) return "petites_annonces";
  return null;
}

export async function fetchToggles(locale = "fr-FR", signal?: AbortSignal): Promise<ToggleMap> {
  const res = await fetch(`/api/public/toggles?locale=${encodeURIComponent(locale)}`, {
    headers: { "Accept": "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Toggles HTTP ${res.status}`);
  return res.json();
}

// Helper : déclencher l'emoji selon visibilité
export function fireSectionOpenOrOff(section: SectionKey, t: ToggleMap, profile: "visitor"|"investisseur"|"porteur"|"admin"="visitor") {
  const info = t?.[section];
  if (!info) return;
  if (info.visible) {
    triggerEmoji("category_open", { section, profile });
  } else {
    triggerEmoji("category_off_view", { section, profile });
  }
}

// Petit hook générique pour charger les toggles (cache léger)
export function useToggles(locale = "fr-FR") {
  const [data, setData] = useState<ToggleMap | null>(null);
  const [err, setErr] = useState<Error | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetchToggles(locale, ctrl.signal).then(setData).catch(setErr);
    return () => ctrl.abort();
  }, [locale]);
  return { toggles: data, error: err };
}