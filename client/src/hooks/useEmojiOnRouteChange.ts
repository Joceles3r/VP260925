import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToggles, sectionFromPath, fireSectionOpenOrOff, type SectionKey } from "@/components/emoji/integration/utils";

type Opts = {
  locale?: string;                  // "fr-FR" par défaut
  profile?: "visitor"|"investisseur"|"porteur"|"admin";
  triggerOnVisibleOnly?: boolean;   // true = ne burst que si visible; false = off → 🚧
};

export function useEmojiOnRouteChange(opts: Opts = {}) {
  const { locale="fr-FR", profile="visitor", triggerOnVisibleOnly=false } = opts;
  const [location] = useLocation();
  const { toggles } = useToggles(locale);
  const lastSectionRef = useRef<SectionKey | null>(null);

  useEffect(() => {
    const section = sectionFromPath(location);
    if (!section || !toggles) return;

    // Evite de re-tirer si on reste dans la même section
    if (lastSectionRef.current === section) return;
    lastSectionRef.current = section;

    const info = toggles[section];
    if (!info) return;

    if (info.visible) {
      fireSectionOpenOrOff(section, toggles, profile); // déclenche "category_open"
    } else {
      if (!triggerOnVisibleOnly) {
        fireSectionOpenOrOff(section, toggles, profile); // déclenche "category_off_view"
      }
    }
  }, [location, toggles, locale, profile, triggerOnVisibleOnly]);
}