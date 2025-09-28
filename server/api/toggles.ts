import { Router, Request, Response } from "express";

export const router = Router();

// Mock toggles data - in production this would come from database
const mockToggles = {
  films: { visible: true, message: "", schedule_start: null, schedule_end: null },
  videos: { visible: true, message: "", schedule_start: null, schedule_end: null },
  documentaires: { visible: true, message: "", schedule_start: null, schedule_end: null },
  voix_info: { visible: false, message: "Catégorie en travaux", schedule_start: null, schedule_end: null },
  live_show: { visible: true, message: "", schedule_start: null, schedule_end: null },
  livres: { visible: true, message: "", schedule_start: null, schedule_end: null },
  petites_annonces: { visible: true, message: "", schedule_start: null, schedule_end: null }
};

// Localized messages for OFF states
const localizedMessages = {
  "fr-FR": {
    categoryOff: "Catégorie en travaux",
    sectionOff: "Rubrique en travaux"
  },
  "en-US": {
    categoryOff: "Category under construction",
    sectionOff: "Section under construction"
  },
  "es-ES": {
    categoryOff: "Categoría en construcción",
    sectionOff: "Sección en construcción"
  }
};

function resolveMessage(toggle: any, locale: string): string {
  if (toggle.message) return toggle.message;
  const messages = localizedMessages[locale as keyof typeof localizedMessages] || localizedMessages["fr-FR"];
  return messages.categoryOff;
}

router.get("/api/public/toggles", async (req: Request, res: Response) => {
  const locale = (req.query.locale as string) || "fr-FR";
  const now = new Date();
  const out: any = {};
  
  Object.entries(mockToggles).forEach(([key, toggle]) => {
    let visible = toggle.visible;
    
    // Check schedule
    if (toggle.schedule_start && now >= new Date(toggle.schedule_start)) visible = true;
    if (toggle.schedule_end && now >= new Date(toggle.schedule_end)) visible = false;
    
    out[key] = { 
      visible, 
      message: visible ? "" : resolveMessage(toggle, locale) 
    };
  });
  
  // Cache for 5 seconds
  res.setHeader("Cache-Control", "public, max-age=5");
  res.json(out);
});

// Admin endpoint to update toggles
router.patch("/api/admin/toggles/:key", async (req: Request, res: Response) => {
  // TODO: Add admin authentication middleware
  const { key } = req.params;
  const { visible, message, schedule_start, schedule_end } = req.body;
  
  if (!mockToggles[key as keyof typeof mockToggles]) {
    return res.status(404).json({ error: "Toggle not found" });
  }
  
  // Update toggle (in production, this would update the database)
  if (typeof visible === 'boolean') mockToggles[key as keyof typeof mockToggles].visible = visible;
  if (typeof message === 'string') mockToggles[key as keyof typeof mockToggles].message = message;
  
  res.json({ success: true, key, updated: { visible, message } });
});