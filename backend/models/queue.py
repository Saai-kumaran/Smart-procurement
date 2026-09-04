"""Queue entry and waiting time tracking model."""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    token_number = Column(Integer, nullable=False)
    centre_id = Column(String(36), ForeignKey("procurement_centres.id"), nullable=False, index=True)
    entry_time = Column(DateTime, default=datetime.utcnow)
    estimated_wait_minutes = Column(Integer, default=30)
    current_stage = Column(String(50), default="WAITING")  # WAITING, INSPECTION, WEIGHING, COMPLETED
    stage_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="queue_entry")
    centre = relationship("ProcurementCentre", back_populates="queue_entries")
