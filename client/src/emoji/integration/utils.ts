export type SectionKey = "films"|"videos"|"documentaires"|"voix_info"|"live_show"|"livres"|"petites_annonces";
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