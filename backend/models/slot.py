"""Procurement time slot model."""
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class Slot(Base):
    __tablename__ = "slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    centre_id = Column(String(36), ForeignKey("procurement_centres.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)  # e.g., "08:00"
    end_time = Column(String(10), nullable=False)    # e.g., "10:00"
    max_capacity_quintals = Column(Float, nullable=False)
    reserved_capacity_quintals = Column(Float, default=0.0)
    max_vehicles = Column(Integer, default=25)
    booked_vehicles = Column(Integer, default=0)
    status = Column(String(20), default="OPEN")  # OPEN, FULL, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("centre_id", "slot_date", "start_time", name="uq_centre_slot_time"),
    )

    # Relationships
    centre = relationship("ProcurementCentre", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

    @property
    def remaining_capacity(self) -> float:
        return max(0.0, self.max_capacity_quintals - self.reserved_capacity_quintals)

    @property
    def is_available(self) -> bool:
        return self.status == "OPEN" and self.remaining_capacity > 0 and self.booked_vehicles < self.max_vehicles
