import { Router } from "express";
import Stripe from "stripe";
import { bunnyClient } from "../../services/bunnyClient";
import type { IStorage } from "../../storage";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

router.post("/webhooks/bunny", async (req: any, res) => {
  let event: Stripe.Event;

  try {
    if (endpointSecret) {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } else {
      event = req.body as Stripe.Event;
    }
  } catch (err: any) {
    console.error("[Bunny Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("[Bunny Webhook] Event received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.metadata?.kind === "bunny_video_deposit") {
      try {
        const storage: IStorage = req.app.locals.storage;
        const { userId, projectId, type, durationSec, title } = session.metadata;

        const videoTitle = title || `${type}-${Date.now()}`;
        const bunnyVideo = await bunnyClient.createVideo(videoTitle);
        const uploadUrl = bunnyClient.getUploadUrl(bunnyVideo.guid);

        const depositId = await storage.createVideoDeposit({
          projectId,
          creatorId: userId,
          videoType: type as any,
          originalFilename: videoTitle,
          bunnyVideoId: bunnyVideo.guid,
          bunnyLibraryId: process.env.BUNNY_LIBRARY_ID || "",
          duration: parseInt(durationSec),
          depositFee: String(session.amount_total! / 100),
          paymentIntentId: session.payment_intent as string,
          status: "processing",
          paidAt: new Date()
        });

        console.log("[Bunny Webhook] Video deposit created:", {
          depositId,
          bunnyVideoId: bunnyVideo.guid,
          uploadUrl
        });

        await storage.updateVideoDeposit(depositId, {
          hlsPlaylistUrl: bunnyClient.hlsManifestUrl(bunnyVideo.guid)
        });

      } catch (error: any) {
        console.error("[Bunny Webhook] Error processing deposit:", error);
      }
    }
  }

  return res.json({ ok: true });
});

export default router;
