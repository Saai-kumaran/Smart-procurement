"""
Models package initialization.
Exports all SQLAlchemy models for clean imports across backend.
"""
from backend.models.base import Base, engine, SessionLocal, get_db
from backend.models.user import User
from backend.models.farmer import Farmer
from backend.models.farm import Farm
from backend.models.crop import Crop
from backend.models.centre import ProcurementCentre
from backend.models.slot import Slot
from backend.models.booking import Booking, BookingStatus
from backend.models.queue import QueueEntry
from backend.models.weather import WeatherData
from backend.models.satellite import SatelliteObservation
from backend.models.prediction import CropPrediction
from backend.models.inspection import Inspection
from backend.models.weighing import Weighment
from backend.models.payment import Payment

# Define CentreCapacity and Notification helper models
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class CentreCapacity(Base):
    __tablename__ = "centre_capacity"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    centre_id = Column(String(36), ForeignKey("procurement_centres.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    total_arrivals_quintals = Column(Float, default=0.0)
    processed_quintals = Column(Float, default=0.0)
    current_queue_count = Column(Integer, default=0)
    avg_turnaround_minutes = Column(Float, default=45.0)
    utilization_pct = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    centre = relationship("ProcurementCentre", back_populates="capacity_logs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(20), nullable=False)  # SMS, IVR, PUSH, IN_APP
    title = Column(String(150), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="SENT")
    sent_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "User",
    "Farmer",
    "Farm",
    "Crop",
    "ProcurementCentre",
    "Slot",
    "Booking",
    "BookingStatus",
    "QueueEntry",
    "WeatherData",
    "SatelliteObservation",
    "CropPrediction",
    "CentreCapacity",
    "Notification",
    "Inspection",
    "Weighment",
    "Payment"
]
