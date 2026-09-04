"""Satellite observation model (Sentinel-2 B04/B08 and NDVI)."""
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_date = Column(Date, nullable=False)
    band_b04_red = Column(Float, nullable=True)
    band_b08_nir = Column(Float, nullable=True)
    ndvi_value = Column(Float, nullable=False)
    cloud_cover_pct = Column(Float, default=0.0)
    satellite_source = Column(String(50), default="Sentinel-2")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    farm = relationship("Farm", back_populates="satellite_observations")
