# Path: server/middleware/rate_limit.py
# SlowAPI integration for FastAPI rate-limiting
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

def init_rate_limit(app):
    @app.exception_handler(RateLimitExceeded)
    async def ratelimit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse({"detail":"Too Many Requests"}, status_code=429)
    app.state.limiter = limiter
    return limiter
