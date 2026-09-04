"""Crop registration and lifecycle model."""
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    sowing_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=False)
    estimated_quantity_quintals = Column(Float, nullable=False)
    msp_rate_per_quintal = Column(Float, default=2275.0)
    status = Column(String(50), default="REGISTERED")  # REGISTERED, NEAR_HARVEST, READY, HARVESTED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farm = relationship("Farm", back_populates="crops")
    bookings = relationship("Booking", back_populates="crop")
    predictions = relationship("CropPrediction", back_populates="crop", cascade="all, delete-orphan")
