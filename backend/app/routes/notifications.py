from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, FoundItem, Claim

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/")
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = []

    # 1. Alerts for items posted by current user (Incoming claims needing review)
    user_items = db.query(FoundItem).filter(FoundItem.posted_by == current_user.id).all()
    user_item_ids = [item.id for item in user_items]

    if user_item_ids:
        incoming_claims = db.query(Claim).filter(
            Claim.item_id.in_(user_item_ids),
            Claim.status == "pending"
        ).all()

        for claim in incoming_claims:
            item = db.query(FoundItem).filter(FoundItem.id == claim.item_id).first()
            notifications.append({
                "id": f"claim-in-{claim.id}",
                "title": "🔔 New Ownership Claim Received",
                "message": f"A user submitted proof for your reported found item '{item.item_name if item else 'Item'}'.",
                "type": "warning",
                "date": claim.created_at
            })

    # 2. Alerts for claims submitted by current user (Status updates: Approved / Rejected)
    my_claims = db.query(Claim).filter(Claim.claimed_by == current_user.id).all()
    for claim in my_claims:
        if claim.status in ["approved", "rejected"]:
            item = db.query(FoundItem).filter(FoundItem.id == claim.item_id).first()
            item_name = item.item_name if item else "Item"
            
            is_approved = claim.status == "approved"
            notifications.append({
                "id": f"claim-out-{claim.id}",
                "title": "🎉 Claim Approved!" if is_approved else "❌ Claim Not Accepted",
                "message": f"Your claim request for '{item_name}' was approved! You can pick it up at the Lost & Found office." if is_approved else f"Your claim for '{item_name}' was rejected by the finder.",
                "type": "success" if is_approved else "danger",
                "date": claim.created_at
            })

    return sorted(notifications, key=lambda x: str(x["date"]), reverse=True)