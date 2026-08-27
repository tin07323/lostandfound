from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, LostReport, FoundItem

router = APIRouter(prefix="/api/matches", tags=["Item Matching Engine"])

@router.get("/my-matches")
def get_my_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch active lost reports by current user
    user_lost = db.query(LostReport).filter(
        LostReport.reported_by == current_user.id,
        LostReport.school_id == current_user.school_id
    ).all()

    # Fetch unclaimed found items in the same school workspace
    found_items = db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id,
        FoundItem.status == "unclaimed"
    ).all()

    matches = []
    for lost in user_lost:
        for found in found_items:
            score = 0
            reasons = []

            # 1. Category Match (40 Points)
            if lost.category and found.category and lost.category.lower() == found.category.lower():
                score += 40
                reasons.append("Matching Category")

            # 2. Color Match (20 Points)
            if lost.color and found.color and lost.color.lower() in found.color.lower():
                score += 20
                reasons.append("Matching Color")

            # 3. Brand Match (20 Points)
            if lost.brand and found.brand and lost.brand.lower() in found.brand.lower():
                score += 20
                reasons.append("Matching Brand")

            # 4. Title Keyword Similarity Match (20 Points)
            lost_words = set(lost.item_name.lower().split())
            found_words = set(found.item_name.lower().split())
            common_words = lost_words.intersection(found_words)
            if common_words:
                score += 20
                reasons.append(f"Matching Title Keywords ({', '.join(common_words)})")

            # Return items with confidence score >= 40%
            if score >= 40:
                matches.append({
                    "id": f"{lost.id}_{found.id}",
                    "lost_item_name": lost.item_name,
                    "found_item": {
                        "id": str(found.id),
                        "item_name": found.item_name,
                        "category": found.category,
                        "color": found.color,
                        "brand": found.brand,
                        "location_found": found.location_found,
                        "description": found.description,
                        "photo_url": found.photo_url,
                        "posted_by": str(found.posted_by),
                        "status": found.status
                    },
                    "confidence_score": min(score, 100),
                    "match_reasons": reasons
                })

    return sorted(matches, key=lambda x: x["confidence_score"], reverse=True)