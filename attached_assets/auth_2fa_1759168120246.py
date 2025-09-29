# Path: server/routes/auth_2fa.py
# FastAPI TOTP 2FA endpoints (enable, verify, disable) + backup codes
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os, base64, secrets, hashlib, time
try:
    import pyotp
except Exception:
    pyotp = None  # install via: pip install pyotp

router = APIRouter(prefix="/api/auth/2fa", tags=["auth-2fa"])

# ---- Replace these stubs with your real user/session deps ----
def get_current_user():
    # TODO: plug to your auth system
    return {"id":"demo-user-1","email":"user@example.com","twofa_enabled":False}

def db_set_2fa_secret(user_id:str, secret:str):
    # TODO: save TOTP secret securely (KMS/Hashicorp Vault or at least encrypted at rest)
    return True

def db_get_2fa_secret(user_id:str):
    # TODO: fetch secret; return None if not set
    return os.getenv("DEMO_TOTP_SECRET")

def db_enable_2fa(user_id:str, enabled:bool):
    return True

def db_store_backup_codes(user_id:str, codes_hashed:list[str]):
    # store hashed backup codes (SHA256)
    return True

def db_get_backup_codes(user_id:str)->list[str]:
    # return list of SHA256 hashes (remaining codes)
    return []

def db_consume_backup_code(user_id:str, code_plain:str)->bool:
    code_hash = hashlib.sha256(code_plain.encode()).hexdigest()
    existing = db_get_backup_codes(user_id)
    if code_hash in existing:
        # TODO: remove from DB
        return True
    return False
# --------------------------------------------------------------

class TwoFASetupOut(BaseModel):
    otpauth_url: str
    secret_base32: str

@router.post("/enable", response_model=TwoFASetupOut)
def enable_2fa(user=Depends(get_current_user)):
    if pyotp is None:
        raise HTTPException(500, "pyotp not installed")
    secret = pyotp.random_base32()
    issuer = os.getenv("VISUAL_ISSUER","VISUAL")
    email = user["email"]
    otpauth_url = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)
    db_set_2fa_secret(user["id"], secret)
    # generate backup codes (one-time, 10 codes)
    codes = [secrets.token_hex(4) for _ in range(10)]
    db_store_backup_codes(user["id"], [hashlib.sha256(c.encode()).hexdigest() for c in codes])
    db_enable_2fa(user["id"], True)
    return {"otpauth_url": otpauth_url, "secret_base32": secret}

class VerifyIn(BaseModel):
    code: str  # TOTP code or backup code

@router.post("/verify")
def verify_2fa(body: VerifyIn, user=Depends(get_current_user)):
    if pyotp is None:
        raise HTTPException(500, "pyotp not installed")
    secret = db_get_2fa_secret(user["id"])
    if not secret:
        raise HTTPException(400, "2FA not enabled")
    totp = pyotp.TOTP(secret)
    if totp.verify(body.code, valid_window=1):
        return {"ok": True, "method": "totp"}
    # fallback to backup code
    if db_consume_backup_code(user["id"], body.code):
        return {"ok": True, "method": "backup_code"}
    raise HTTPException(401, "Invalid 2FA code")

@router.post("/disable")
def disable_2fa(user=Depends(get_current_user)):
    db_enable_2fa(user["id"], False)
    return {"ok": True}
