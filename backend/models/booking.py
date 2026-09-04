"""Booking model representing farmer slot reservation and digital pass."""
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class BookingStatus:
    BOOKED = "BOOKED"
    ARRIVED = "ARRIVED"
    CHECKED_IN = "CHECKED_IN"
    INSPECTION = "INSPECTION"
    QUALITY_CHECK = "QUALITY_CHECK"
    WEIGHING = "WEIGHING"
    PROCUREMENT_COMPLETED = "PROCUREMENT_COMPLETED"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAYMENT_SETTLED = "PAYMENT_SETTLED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_token = Column(String(50), unique=True, nullable=False, index=True)
    farmer_id = Column(String(36), ForeignKey("farmers.id"), nullable=False, index=True)
    centre_id = Column(String(36), ForeignKey("procurement_centres.id"), nullable=False, index=True)
    slot_id = Column(String(36), ForeignKey("slots.id"), nullable=False)
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False)
    booked_quantity_quintals = Column(Float, nullable=False)
    status = Column(String(50), default=BookingStatus.BOOKED, index=True)
    qr_token = Column(String(100), unique=True, nullable=False)
    distance_km = Column(Float, nullable=True)
    estimated_travel_minutes = Column(Float, nullable=True)
    weather_risk_level = Column(String(20), default="LOW")
    crop_maturity_score = Column(Float, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="bookings")
    centre = relationship("ProcurementCentre", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")
    crop = relationship("Crop", back_populates="bookings")
    queue_entry = relationship("QueueEntry", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    inspection = relationship("Inspection", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    weighment = relationship("Weighment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
