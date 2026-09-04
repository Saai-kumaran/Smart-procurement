"""Weather observation and forecast cache model."""
from sqlalchemy import Column, String, Float, Text, Date, DateTime
from datetime import datetime
import uuid
from backend.models.base import Base

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_key = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    forecast_date = Column(Date, nullable=False)
    temperature_celsius = Column(Float, nullable=True)
    rainfall_mm = Column(Float, default=0.0)
    humidity_percentage = Column(Float, nullable=True)
    weather_condition = Column(String(100), nullable=True)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    warning_text = Column(Text, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)
