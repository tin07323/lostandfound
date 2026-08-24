from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class FoundItemCreate(BaseModel):
    item_name: str
    category: str
    item_type: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    description: str
    location_found: str
    date_found: datetime
    photo_url: Optional[str] = None

class FoundItemResponse(FoundItemCreate):
    id: UUID
    school_id: UUID
    posted_by: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True