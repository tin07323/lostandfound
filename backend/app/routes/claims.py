from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, FoundItem, Claim
from pydantic import BaseModel

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/claims", tags=["Claims"])

class ClaimCreate(BaseModel):
    item_id: str
    proof_description: str

@router.post("/")
@limiter.limit("5/minute")
def create_claim(
    request: Request,
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify target item exists
    item = db.query(FoundItem).filter(FoundItem.id == claim_data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Found item not found.")

    # Prevent users from claiming their own posted items
    if str(item.posted_by) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot claim an item you posted yourself.")

    # Check for duplicate pending claims
    existing_claim = db.query(Claim).filter(
        Claim.item_id == claim_data.item_id,
        Claim.claimed_by == current_user.id,
        Claim.status == "pending"
    ).first()

    if existing_claim:
        raise HTTPException(status_code=400, detail="You already have a pending claim for this item.")

    new_claim = Claim(
        item_id=claim_data.item_id,
        claimed_by=current_user.id,
        proof_description=claim_data.proof_description,
        status="pending"
    )

    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    return {"message": "Claim submitted successfully.", "claim_id": str(new_claim.id)}