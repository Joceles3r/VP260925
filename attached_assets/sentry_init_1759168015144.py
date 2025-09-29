# Path: server/observability/sentry_init.py
import os
def init_sentry():
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return None
    import sentry_sdk
    sentry_sdk.init(
        dsn=dsn,
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_RATE","0.2")),
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_RATE","0.0")),
        environment=os.getenv("ENV","dev"),
        release=os.getenv("RELEASE","local")
    )
    return True
