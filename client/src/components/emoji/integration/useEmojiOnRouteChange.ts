import { useEffect, useRef } from "react";
import { useToggles, sectionFromPath, fireSectionOpenOrOff, SectionKey } from "./utils";

type Opts = {
  pathname: string;                 // chemin courant
  locale?: string;                  // "fr-FR" par défaut
  profile?: "visitor"|"investisseur"|"porteur"|"admin";
  triggerOnVisibleOnly?: boolean;   // true = ne burst que si visible; false = off → 🚧
};

export function useEmojiOnRouteChange(opts: Opts) {
  const { pathname, locale="fr-FR", profile="visitor", triggerOnVisibleOnly=false } = opts;
  const { toggles } = useToggles(locale);
  const lastSectionRef = useRef<SectionKey | null>(null);

  useEffect(() => {
    const section = sectionFromPath(pathname);
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
  }, [pathname, toggles, locale, profile, triggerOnVisibleOnly]);
}