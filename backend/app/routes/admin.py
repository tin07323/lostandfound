from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, LostReport, FoundItem, Claim

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

def verify_admin(user: User):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )

@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    total_found = db.query(FoundItem).filter(FoundItem.school_id == current_user.school_id).count()
    unclaimed_count = db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id,
        func.lower(FoundItem.status) == "unclaimed"
    ).count()
    claimed_count = db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id,
        func.lower(FoundItem.status) == "claimed"
    ).count()
    total_lost = db.query(LostReport).filter(LostReport.school_id == current_user.school_id).count()
    total_claims = db.query(Claim).join(FoundItem).filter(FoundItem.school_id == current_user.school_id).count()
    total_users = db.query(User).filter(User.school_id == current_user.school_id).count()

    return {
        "total_found_items": total_found,
        "unclaimed_items": unclaimed_count,
        "claimed_items": claimed_count,
        "total_lost_reports": total_lost,
        "total_claims_submitted": total_claims,
        "total_school_users": total_users,
    }

@router.get("/users")
def get_school_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)
    users = db.query(User).filter(User.school_id == current_user.school_id).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role_data: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)
    new_role = role_data.get("role")
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    target_user = db.query(User).filter(
        User.id == user_id,
        User.school_id == current_user.school_id
    ).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="User specified not found.")

    target_user.role = new_role
    db.commit()
    return {"message": f"User role updated to {new_role} successfully."}