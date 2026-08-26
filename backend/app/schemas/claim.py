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