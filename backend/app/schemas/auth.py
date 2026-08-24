from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class SchoolCreate(BaseModel):
    name: str
    join_code: str

class JoinSchoolRequest(BaseModel):
    join_code: str
    name: str

class UserResponse(BaseModel):
    id: UUID
    school_id: UUID
    auth_user_id: UUID
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SchoolResponse(BaseModel):
    id: UUID
    name: str
    join_code: str
    logo_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True