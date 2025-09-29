import { Router, Request, Response } from "express";
export const togglesRouter = Router();

// TODO: remplace par une vraie lecture DB/config
const TOGGLES: Record<string,{is_visible:boolean,msg_off:string}> = {
  films:{is_visible:true,msg_off:""}, videos:{is_visible:true,msg_off:""},
  documentaires:{is_visible:true,msg_off:""}, voix_info:{is_visible:true,msg_off:""},
  live_show:{is_visible:true,msg_off:""}, livres:{is_visible:true,msg_off:""},
  petites_annonces:{is_visible:true,msg_off:""}
};

function resolveMessage(k: string, locale = "fr-FR") {
  const m = TOGGLES[k]?.msg_off || "Catégorie en travaux / en cours.";
  return m;
}

togglesRouter.get("/api/public/toggles", async (req: Request, res: Response) => {
  const locale = (req.query.locale as string) || "fr-FR";
  const out: any = {};
  Object.keys(TOGGLES).forEach(k => {
    const t = TOGGLES[k];
    out[k] = { visible: t.is_visible, message: t.is_visible ? "" : resolveMessage(k, locale) };
  });
  res.setHeader("Cache-Control", "public, max-age=5");
  res.json(out);
});