# Path: server/services/escrow_service.py
# Simple escrow service for Petites Annonces
from dataclasses import dataclass
from enum import Enum
from typing import Optional
import time

class EscrowStatus(str, Enum):
    HELD="HELD"
    RELEASED="RELEASED"
    REFUNDED="REFUNDED"

@dataclass
class EscrowRecord:
    id: str
    buyer_id: str
    seller_id: str
    amount_cents: int
    fee_cents: int
    stripe_payment_intent: str
    status: EscrowStatus
    created_at: int
    released_at: Optional[int]=None
    refunded_at: Optional[int]=None

# TODO: persist in DB (table escrow_transactions + escrow_ledger)
def create_hold(buyer_id:str, seller_id:str, amount_cents:int, fee_cents:int, pi:str)->EscrowRecord:
    rid = f"esc_{int(time.time())}_{buyer_id}"
    rec = EscrowRecord(id=rid,buyer_id=buyer_id,seller_id=seller_id,amount_cents=amount_cents,fee_cents=fee_cents,
                       stripe_payment_intent=pi,status=EscrowStatus.HELD,created_at=int(time.time()))
    # save to DB...
    return rec

def release_hold(record_id:str)->bool:
    # update DB -> RELEASED, transfer to seller
    return True

def refund_hold(record_id:str)->bool:
    # update DB -> REFUNDED, refund buyer
    return True
