"""Quality assessment and inspection model."""
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id"), unique=True, nullable=False)
    officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    moisture_percentage = Column(Float, nullable=False)
    foreign_matter_percentage = Column(Float, nullable=False)
    damaged_grains_percentage = Column(Float, default=1.0)
    quality_grade = Column(String(20), nullable=False)  # GRADE_A, GRADE_B, GRADE_C, REJECTED
    inspection_status = Column(String(20), default="APPROVED")
    remarks = Column(Text, nullable=True)
    inspected_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="inspection")
    officer = relationship("User", foreign_keys=[officer_id])
