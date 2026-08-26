from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, LostReport, FoundItem
from app.schemas.found_item import FoundItemResponse

router = APIRouter(prefix="/api/matches", tags=["Automated Matching"])

@router.get("/lost/{lost_report_id}", response_model=List[FoundItemResponse])
def get_matches_for_lost_report(
    lost_report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lost_item = db.query(LostReport).filter(
        LostReport.id == lost_report_id,
        LostReport.school_id == current_user.school_id
    ).first()

    if not lost_item:
        raise HTTPException(status_code=404, detail="Lost report not found.")

    # Match criteria: Same school, unclaimed status, and matching category or keywords
    query = db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id,
        FoundItem.status == "unclaimed",
        FoundItem.category == lost_item.category
    )

    # Optional color matching filter if available
    if lost_item.color:
        query = query.filter(
            or_(
                func.lower(FoundItem.color).contains(lost_item.color.lower()),
                func.lower(FoundItem.description).contains(lost_item.color.lower())
            )
        )

    matches = query.limit(10).all()
    return matches