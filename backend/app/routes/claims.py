from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, FoundItem, Claim
from app.schemas.claim import ClaimCreate, ClaimResponse

router = APIRouter(prefix="/api/claims", tags=["Claims & Verification"])

@router.post("/", response_model=ClaimResponse)
def submit_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(FoundItem).filter(
        FoundItem.id == str(claim_data.item_id),
        FoundItem.school_id == current_user.school_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    
    if item.status == "claimed":
        raise HTTPException(status_code=400, detail="Item has already been claimed.")

    new_claim = Claim(
        item_id=item.id,
        claimed_by=current_user.id,
        proof_description=claim_data.proof_description
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
    return new_claim

@router.get("/item/{item_id}", response_model=List[ClaimResponse])
def get_claims_for_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(FoundItem).filter(FoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    if item.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view claims for this item.")

    return db.query(Claim).filter(Claim.item_id == item_id).all()

@router.put("/{claim_id}/approve")
def approve_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    item = db.query(FoundItem).filter(FoundItem.id == claim.item_id).first()
    if item.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to resolve this claim.")

    claim.status = "approved"
    item.status = "claimed"
    db.commit()
    return {"message": "Claim approved and item marked as claimed."}

@router.put("/{claim_id}/reject")
def reject_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    item = db.query(FoundItem).filter(FoundItem.id == claim.item_id).first()
    if item.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to resolve this claim.")

    claim.status = "rejected"
    db.commit()
    return {"message": "Claim rejected."}

@router.get("/my-claims")
def get_my_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claims = db.query(Claim).filter(Claim.claimed_by == current_user.id).all()
    result = []
    for c in claims:
        item = db.query(FoundItem).filter(FoundItem.id == c.item_id).first()
        result.append({
            "id": str(c.id),
            "item_id": str(c.item_id),
            "item_name": item.item_name if item else "Unknown Item",
            "proof_description": c.proof_description,
            "status": c.status,
            "created_at": c.created_at
        })
    return result