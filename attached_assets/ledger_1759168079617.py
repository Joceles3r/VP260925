# Path: server/audit/ledger.py
# HMAC-signed audit trail (append-only)
import hmac, hashlib, time, os, json, threading
LOCK = threading.Lock()
KEY = (os.getenv("AUDIT_HMAC_KEY") or "dev-secret").encode()

def _sign(payload: bytes) -> str:
    return hmac.new(KEY, payload, hashlib.sha256).hexdigest()

def append_audit(event_type: str, actor_id: str, data: dict, storage_path="var/audit.log"):
    ts = int(time.time())
    record = {"ts": ts, "type": event_type, "actor": actor_id, "data": data}
    raw = json.dumps(record, separators=(",",":"), sort_keys=True).encode()
    sig = _sign(raw)
    line = json.dumps({"record": record, "sig": sig}) + "\n"
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    with LOCK, open(storage_path, "a", encoding="utf-8") as f:
        f.write(line)
    return True

def verify_file(storage_path="var/audit.log"):
    ok = True
    if not os.path.exists(storage_path): return ok
    with open(storage_path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            try:
                obj = json.loads(line)
                raw = json.dumps(obj["record"], separators=(",",":"), sort_keys=True).encode()
                if _sign(raw) != obj["sig"]:
                    ok = False; break
            except Exception:
                ok = False; break
    return ok
