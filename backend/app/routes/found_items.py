from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.models import User, FoundItem
from app.schemas.found_item import FoundItemCreate, FoundItemResponse

router = APIRouter(prefix="/api/found-items", tags=["Found Items"])

@router.post("/", response_model=FoundItemResponse)
def create_found_item(
    item_data: FoundItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_item = FoundItem(
        school_id=current_user.school_id,
        posted_by=current_user.id,
        **item_data.model_dump()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.get("/", response_model=List[FoundItemResponse])
def list_found_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce tenant isolation by school_id
    return db.query(FoundItem).filter(
        FoundItem.school_id == current_user.school_id
    ).order_by(FoundItem.created_at.desc()).all()

@router.get("/{item_id}", response_model=FoundItemResponse)
def get_found_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(FoundItem).filter(
        FoundItem.id == item_id,
        FoundItem.school_id == current_user.school_id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found item not found.")
    return item

@router.delete("/{item_id}")
def delete_found_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(FoundItem).filter(
        FoundItem.id == item_id,
        FoundItem.school_id == current_user.school_id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found item not found.")
    
    # Creator or admin authorization check
    if item.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this post.")

    db.delete(item)
    db.commit()
    return {"message": "Found item deleted successfully"}