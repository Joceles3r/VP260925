# FastAPI health/readiness/metrics routes for VISUAL
# Path: server/routes/health.py
from fastapi import APIRouter, Response, status
from fastapi.responses import JSONResponse, PlainTextResponse
import os, time, asyncio

# Prometheus metrics (pip install prometheus-client)
try:
    from prometheus_client import CollectorRegistry, Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
except Exception:
    # Minimal no-op fallbacks if prometheus-client isn't installed, so /healthz still works
    CollectorRegistry = object  # type: ignore
    Counter = lambda *a, **k: None  # type: ignore
    Gauge = lambda *a, **k: None    # type: ignore
    def generate_latest(*a, **k): return b""  # type: ignore
    CONTENT_TYPE_LATEST = "text/plain"

router = APIRouter(prefix="", tags=["health"])

START_TS = time.time()

# Metrics
REGISTRY = CollectorRegistry() if callable(getattr(CollectorRegistry, "__call__", None)) else None
def _counter(name, desc):
    if REGISTRY is None or Counter is None: return None
    try: return Counter(name, desc, registry=REGISTRY)
    except Exception: return None

def _gauge(name, desc):
    if REGISTRY is None or Gauge is None: return None
    try: return Gauge(name, desc, registry=REGISTRY)
    except Exception: return None

REQ_HEALTH = _counter("healthz_requests_total", "Total /healthz requests")
REQ_READY  = _counter("readyz_requests_total", "Total /readyz requests")
UPTIME_G   = _gauge("app_uptime_seconds", "Application uptime seconds")
READY_G    = _gauge("app_ready", "1 if ready, else 0")

async def _check_db(timeout=2.0):
    dsn = os.getenv("DB_DSN") or os.getenv("DATABASE_URL")
    if not dsn:
        return {"ok": False, "reason": "missing DSN env"}
    # Try asyncpg if available
    try:
        import asyncpg  # type: ignore
        conn = await asyncio.wait_for(asyncpg.connect(dsn), timeout=timeout)
        try:
            await asyncio.wait_for(conn.execute("SELECT 1;"), timeout=timeout)
        finally:
            await conn.close()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "reason": str(e)}

async def _check_stripe(timeout=2.0):
    # Shallow check: presence of API key; deep check optional
    sk = os.getenv("STRIPE_API_KEY")
    if not sk:
        return {"ok": False, "reason": "missing STRIPE_API_KEY"}
    if os.getenv("READYZ_STRIPE_DEEP") == "1":
        try:
            import stripe  # type: ignore
            stripe.api_key = sk
            # Shallow 'ping' that doesn't charge anything
            await asyncio.wait_for(asyncio.to_thread(lambda: stripe.Account.retrieve()), timeout=timeout)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "reason": str(e)}
    return {"ok": True}

@router.get("/healthz")
async def healthz():
    if REQ_HEALTH: REQ_HEALTH.inc()
    if UPTIME_G: UPTIME_G.set(time.time() - START_TS)
    return JSONResponse({"ok": True, "uptime_s": int(time.time() - START_TS)})

@router.get("/readyz")
async def readyz():
    if REQ_READY: REQ_READY.inc()
    db = await _check_db()
    stripe = await _check_stripe()
    ready = db.get("ok") and stripe.get("ok")
    if READY_G: READY_G.set(1 if ready else 0)
    status_code = status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse({"db": db, "stripe": stripe, "ready": bool(ready)}, status_code=status_code)

@router.get("/metrics")
async def metrics():
    if REGISTRY is None:
        return PlainTextResponse("# prometheus-client not installed\n", media_type="text/plain")
    data = generate_latest(REGISTRY)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)

# To mount in your app:
#   from fastapi import FastAPI
#   from server.routes.health import router as health_router
#   app = FastAPI()
#   app.include_router(health_router)
