"""Weighbridge and net weight verification model."""
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class Weighment(Base):
    __tablename__ = "weighments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id"), unique=True, nullable=False)
    operator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    weighbridge_slip_no = Column(String(50), unique=True, nullable=False)
    gross_weight_quintals = Column(Float, nullable=False)
    tare_weight_quintals = Column(Float, nullable=False)
    net_weight_quintals = Column(Float, nullable=False)
    bag_count = Column(Integer, nullable=False)
    weighed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="weighment")
    operator = relationship("User", foreign_keys=[operator_id])
