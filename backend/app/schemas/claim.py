from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ClaimCreate(BaseModel):
    item_id: UUID
    proof_description: str

class ClaimResponse(BaseModel):
    id: UUID
    item_id: UUID
    claimed_by: UUID
    proof_description: str
    status: str  # 'pending', 'approved', 'rejected'
    created_at: datetime

    class Config:
        from_attributes = True

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