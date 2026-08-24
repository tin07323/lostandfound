import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class School(Base):
    __tablename__ = "schools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    join_code = Column(String(50), unique=True, nullable=False, index=True)
    logo_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="school")
    found_items = relationship("FoundItem", back_populates="school")
    lost_reports = relationship("LostReport", back_populates="school")
    settings = relationship("SchoolSetting", back_populates="school", uselist=False)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    auth_user_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)  # 'student' or 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="users")
    found_items = relationship("FoundItem", back_populates="poster")
    lost_reports = relationship("LostReport", back_populates="reporter")
    claims = relationship("Claim", foreign_keys="[Claim.claimant_id]", back_populates="claimant")
    notifications = relationship("Notification", back_populates="user")


class SchoolSetting(Base):
    __tablename__ = "school_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), unique=True, nullable=False)
    accent_color = Column(String(20), default="#3B82F6")
    banner_url = Column(Text, nullable=True)

    school = relationship("School", back_populates="settings")


class FoundItem(Base):
    __tablename__ = "found_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    item_type = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    brand = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    location_found = Column(String(255), nullable=False)
    date_found = Column(DateTime, nullable=False)
    photo_url = Column(Text, nullable=True)
    status = Column(String(20), default="Available", nullable=False)  # 'Available', 'Claimed', 'Returned'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    school = relationship("School", back_populates="found_items")
    poster = relationship("User", back_populates="found_items")
    claims = relationship("Claim", back_populates="found_item")


class LostReport(Base):
    __tablename__ = "lost_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    color = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    last_known_location = Column(String(255), nullable=False)
    date_lost = Column(DateTime, nullable=False)
    photo_url = Column(Text, nullable=True)
    status = Column(String(20), default="Open", nullable=False)  # 'Open', 'Resolved'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    school = relationship("School", back_populates="lost_reports")
    reporter = relationship("User", back_populates="lost_reports")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    found_item_id = Column(UUID(as_uuid=True), ForeignKey("found_items.id", ondelete="CASCADE"), nullable=False)
    claimant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="Pending", nullable=False)  # 'Pending', 'Approved', 'Rejected'
    review_note = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    pickup_location = Column(String(255), nullable=True)
    pickup_datetime = Column(DateTime, nullable=True)
    contact_details = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    found_item = relationship("FoundItem", back_populates="claims")
    claimant = relationship("User", foreign_keys=[claimant_id], back_populates="claims")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")