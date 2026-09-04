"""Crop prediction and maturity assessment model."""
from sqlalchemy import Column, String, Float, Integer, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class CropPrediction(Base):
    __tablename__ = "crop_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    maturity_score = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)  # EARLY, GROWING, NEAR_HARVEST, READY, OVERMATURE
    estimated_days_to_harvest = Column(Integer, nullable=False)
    prediction_date = Column(Date, nullable=False)
    confidence_score = Column(Float, default=0.88)
    indicators_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    crop = relationship("Crop", back_populates="predictions")
