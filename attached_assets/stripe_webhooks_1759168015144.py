# Path: server/routes/stripe_webhooks.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import os, json, time
from datetime import datetime

router = APIRouter(prefix="/webhooks/stripe", tags=["stripe"])

# Minimal idempotency ledger (replace with DB table 'stripe_events')
PROCESSED = set()

def already_processed(event_id:str)->bool:
    # TODO: replace with DB check (unique index on event_id)
    return event_id in PROCESSED

def mark_processed(event_id:str):
    PROCESSED.add(event_id)

@router.post("")
async def stripe_hook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(500, "Missing STRIPE_WEBHOOK_SECRET")
    try:
        import stripe
        stripe.api_key = os.getenv("STRIPE_API_KEY")
        event = stripe.Webhook.construct_event(payload, sig, secret)
    except Exception as e:
        raise HTTPException(400, f"Invalid payload/signature: {e}")

    if already_processed(event.id):
        return JSONResponse({"status":"ok","dup":True})

    t = event["type"]
    data = event["data"]["object"]
    # ---- Handle business events ----
    if t == "checkout.session.completed":
        # TODO: fulfill order; if 'escrow' category, create escrow hold
        pass
    elif t == "payment_intent.succeeded":
        pass
    elif t == "charge.refunded":
        pass
    # Add more: 'payout.paid', 'transfer.created', etc.

    mark_processed(event.id)
    return JSONResponse({"status":"ok","event":t})
