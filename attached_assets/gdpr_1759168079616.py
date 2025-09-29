# Path: server/routes/gdpr.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import os, json, tempfile, time, shutil

router = APIRouter(prefix="/api/gdpr", tags=["gdpr"])

def get_current_user():
    return {"id":"demo-user-1","email":"user@example.com"}

def fetch_user_data(user_id:str)->dict:
    # TODO: aggregate user profile, purchases, payouts, logs, etc.
    return {"profile":{"id":user_id,"email":"user@example.com"},"activity":[]}

@router.get("/export")
def export_me(user=Depends(get_current_user)):
    data = fetch_user_data(user["id"])
    tmpdir = tempfile.mkdtemp()
    out = os.path.join(tmpdir, f"visual_export_{user['id']}_{int(time.time())}.json")
    with open(out,"w",encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return FileResponse(out, media_type="application/json", filename=os.path.basename(out))

@router.post("/erase")
def erase_me(user=Depends(get_current_user)):
    # TODO: enqueue deletion workflow (anonymize PII, retain minimal finance for compliance)
    # Return ticket id to poll
    ticket_id = f"erase-{user['id']}-{int(time.time())}"
    return {"accepted": True, "ticket": ticket_id, "eta_days": 7}
