from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.found_item import FoundItemResponse

class LostReportCreate(BaseModel):
    item_name: str
    category: str
    color: Optional[str] = None
    brand: Optional[str] = None
    description: str
    last_seen_location: str
    date_lost: datetime

class LostReportResponse(LostReportCreate):
    id: UUID
    school_id: UUID
    reported_by: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MatchResultResponse(BaseModel):
    lost_report: LostReportResponse
    matched_items: List[FoundItemResponse]