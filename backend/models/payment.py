"""Payment and Direct Benefit Transfer (DBT) model."""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.models.base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id"), unique=True, nullable=False)
    farmer_id = Column(String(36), ForeignKey("farmers.id"), nullable=False)
    msp_rate = Column(Float, nullable=False)
    net_quantity_quintals = Column(Float, nullable=False)
    gross_amount = Column(Float, nullable=False)
    deductions = Column(Float, default=0.0)
    net_payable_amount = Column(Float, nullable=False)
    dbt_transaction_ref = Column(String(100), unique=True, nullable=True)
    payment_mode = Column(String(50), default="DBT_AADHAAR_BRIDGE")
    status = Column(String(50), default="PAYMENT_PROCESSING")  # PAYMENT_PROCESSING, PAYMENT_SETTLED, FAILED
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="payment")
    farmer = relationship("Farmer")
