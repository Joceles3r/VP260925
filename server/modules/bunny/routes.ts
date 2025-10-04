import { Router } from "express";
import Stripe from "stripe";
import { bunnyService } from "../../services/bunnyService";
import { getUploadFeeEUR, validateVideoType } from "./pricing";
import { BUNNY_TARIFFS, CREATOR_CAP_EUR, MIN_ACTIVATION_EUR } from "../../../shared/constants/bunnyDeposit";

// Validate Bunny.net configuration at module load
const bunnyConfig = bunnyService.validateBunnyTokenConfig();
console.log(`[BUNNY] ${bunnyConfig.message}`);

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20" as any });
const APP_BASE_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : "http://localhost:5000";

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  next();
}

router.post("/bunny/videos/init-checkout", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { type, durationSec, title, projectId } = req.body;

    if (!validateVideoType(type)) {
      return res.status(400).json({ error: "Type de vidéo invalide" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "ID de projet requis" });
    }

    const feeEur = getUploadFeeEUR(type, durationSec);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: Math.round(feeEur * 100),
          product_data: { 
            name: `Dépôt vidéo (${type})`,
            description: `${title || 'Sans titre'} - ${Math.floor(durationSec / 60)} min`
          }
        },
        quantity: 1
      }],
      metadata: {
        kind: "bunny_video_deposit",
        userId,
        projectId,
        type,
        durationSec: String(durationSec),
        title: title || ""
      },
      success_url: `${APP_BASE_URL}/creator/video/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/creator/video/cancel`
    });

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      feeEur
    });
  } catch (e: any) {
    console.error("[Bunny] Init checkout error:", e);
    return res.status(400).json({ error: e.message });
  }
});

router.get("/bunny/videos/session/:sessionId", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.kind !== "bunny_video_deposit") {
      return res.status(404).json({ error: "Session non trouvée" });
    }

    const videoDeposit = await req.app.locals.storage.getVideoDepositByPaymentIntent(session.payment_intent as string);

    return res.json({
      status: session.payment_status,
      videoDeposit: videoDeposit || null
    });
  } catch (e: any) {
    console.error("[Bunny] Session status error:", e);
    return res.status(400).json({ error: e.message });
  }
});

router.post("/bunny/videos/:guid/play-token", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { guid } = req.params;
    
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "0.0.0.0");
    const ua = req.headers["user-agent"] || "";
    
    // If Bunny CDN Token Authentication is configured, use native signed URLs
    if (!bunnyConfig.fallbackMode) {
      try {
        const signedUrl = bunnyService.generateSignedHlsUrl(guid, 30 * 60, ip);
        return res.json({
          url: signedUrl,
          type: "bunny_cdn_signed",
          expiresInSec: 30 * 60,
          securityNote: "All segments protected by Bunny.net CDN Token Authentication"
        });
      } catch (e: any) {
        console.error("[Bunny] Signed URL generation failed, falling back:", e);
      }
    }
    
    // Fallback: Use legacy token system (manifest-only protection)
    const token = bunnyService.issuePlaybackToken(guid, userId, ip, ua, 3, 30 * 60);
    
    return res.json({
      token,
      type: "legacy_token",
      expiresInSec: 30 * 60,
      maxPlays: 3,
      warningManifestOnlyProtection: "Segments not protected. Enable CDN Token Authentication in Bunny.net for full security."
    });
  } catch (e: any) {
    console.error("[Bunny] Play token error:", e);
    return res.status(400).json({ error: e.message });
  }
});

router.get("/bunny/videos/:guid/manifest.m3u8", async (req: any, res) => {
  try {
    const { guid } = req.params;
    const { token } = req.query as { token?: string };
    
    if (!token) {
      return res.status(401).send("Token manquant");
    }

    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "0.0.0.0");
    const ua = req.headers["user-agent"] || "";
    
    const verification = bunnyService.verifyAndConsumePlaybackToken(token, ip, ua);
    if (!verification.ok || verification.payload?.vid !== guid) {
      return res.status(401).send("Token invalide ou expiré");
    }

    const originUrl = bunnyService.hlsManifestUrl(guid);
    const response = await fetch(originUrl, {
      headers: { "AccessKey": process.env.BUNNY_STREAM_API_KEY! }
    });

    if (!response.ok) {
      return res.status(500).send("Erreur Bunny.net");
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "private, max-age=0, no-store");
    
    const body = await response.text();
    res.send(body);
  } catch (e: any) {
    console.error("[Bunny] Manifest proxy error:", e);
    return res.status(500).send(e.message);
  }
});

router.get("/bunny/usage/estimate", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const storage = req.app.locals.storage;
    
    const deposits = await storage.getCreatorVideoDeposits(userId);
    
    const totalStorageGB = deposits.reduce((sum: number, d: any) => {
      return sum + ((d.fileSize || 0) / (1024 * 1024 * 1024));
    }, 0);

    const estimatedEgressGB = totalStorageGB * 10;
    const totalMinutes = deposits.reduce((sum: number, d: any) => sum + ((d.duration || 0) / 60), 0);

    let variableCost =
      totalStorageGB * BUNNY_TARIFFS.storage_eur_per_gb +
      estimatedEgressGB * BUNNY_TARIFFS.egress_eur_per_gb +
      totalMinutes * BUNNY_TARIFFS.encode_eur_per_min;

    variableCost = Math.max(variableCost, MIN_ACTIVATION_EUR);
    variableCost = Math.min(variableCost, CREATOR_CAP_EUR);

    return res.json({
      month: new Date().toISOString().slice(0, 7),
      usage: {
        storage_gb: Number(totalStorageGB.toFixed(2)),
        egress_gb: Number(estimatedEgressGB.toFixed(2)),
        encode_min: Number(totalMinutes.toFixed(2))
      },
      tariffs: BUNNY_TARIFFS,
      estimated_cost_eur: Number(variableCost.toFixed(2)),
      cap_eur: CREATOR_CAP_EUR,
      min_activation_eur: MIN_ACTIVATION_EUR
    });
  } catch (e: any) {
    console.error("[Bunny] Usage estimate error:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
