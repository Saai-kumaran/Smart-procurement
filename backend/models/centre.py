"""Procurement Centre / APMC Mandi model."""
from sqlalchemy import Column, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    centre_code = Column(String(50), unique=True, nullable=False)
    centre_name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    daily_capacity_quintals = Column(Float, default=1500.0)
    hourly_capacity_quintals = Column(Float, default=150.0)
    geofence_radius_meters = Column(Float, default=500.0)
    operating_hours_start = Column(String(10), default="08:00")
    operating_hours_end = Column(String(10), default="18:00")
    contact_phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    slots = relationship("Slot", back_populates="centre", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="centre")
    queue_entries = relationship("QueueEntry", back_populates="centre")
    capacity_logs = relationship("CentreCapacity", back_populates="centre", cascade="all, delete-orphan")
