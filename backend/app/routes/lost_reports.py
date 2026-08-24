from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, LostReport, FoundItem
from app.schemas.lost_report import LostReportCreate, LostReportResponse, MatchResultResponse
from app.schemas.found_item import FoundItemResponse

router = APIRouter(prefix="/api/lost-reports", tags=["Lost Reports & Auto-Matching"])

@router.post("/", response_model=MatchResultResponse)
def create_lost_report(
    report_data: LostReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_report = LostReport(
        school_id=current_user.school_id,
        reported_by=current_user.id,
        **report_data.model_dump()
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Auto-Matching Logic: Filter unclaimed items in same workspace by category & keyword/color
    color_condition = (
        func.lower(FoundItem.color) == func.lower(new_report.color)
        if new_report.color
        else False
    )

    matches = db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id,
        FoundItem.status == "unclaimed",
        FoundItem.category == new_report.category,
        or_(
            color_condition,
            func.lower(FoundItem.item_name).contains(new_report.item_name.lower()),
            func.lower(FoundItem.description).contains(new_report.item_name.lower())
        )
    ).all()

    return {
        "lost_report": new_report,
        "matched_items": matches
    }

@router.get("/", response_model=List[LostReportResponse])
def list_lost_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(LostReport).filter(
        LostReport.school_id == current_user.school_id
    ).order_by(LostReport.created_at.desc()).all()

@router.get("/{report_id}/matches", response_model=List[FoundItemResponse])
def get_matches_for_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(LostReport).filter(
        LostReport.id == report_id,
        LostReport.school_id == current_user.school_id
    ).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost report not found.")

    color_condition = (
        func.lower(FoundItem.color) == func.lower(report.color)
        if report.color
        else False
    )

    matches = db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id,
        FoundItem.status == "unclaimed",
        FoundItem.category == report.category,
        or_(
            color_condition,
            func.lower(FoundItem.item_name).contains(report.item_name.lower()),
            func.lower(FoundItem.description).contains(report.item_name.lower())
        )
    ).all()

    return matches