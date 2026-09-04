"""Farmer profile model."""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    aadhaar_hash = Column(String(64), nullable=True)
    primary_phone = Column(String(20), nullable=False)
    village = Column(String(100), nullable=False)
    block = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=True)
    preferred_language = Column(String(10), default="hi")
    bank_account_no = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="farmer_profile")
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="farmer")
