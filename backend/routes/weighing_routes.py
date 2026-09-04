"""Weighbridge and Weight Verification Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from backend.models import get_db, Booking, BookingStatus, Weighment
from backend.services.booking_service import booking_service
from backend.integrations.payment_service import payment_service
from backend.models import Payment

router = APIRouter(prefix="/api/weighments", tags=["Weighbridge"])

class WeighmentSubmitRequest(BaseModel):
    booking_id: str
    operator_id: Optional[str] = "usr-off-01"
    gross_weight_quintals: float
    tare_weight_quintals: float
    bag_count: int

@router.post("")
def record_weighment(req: WeighmentSubmitRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    net_weight = round(req.gross_weight_quintals - req.tare_weight_quintals, 2)
    if net_weight <= 0:
        raise HTTPException(status_code=400, detail="Net weight must be greater than zero (Gross > Tare).")

    slip_no = f"WB-{booking.centre.centre_code.split('-')[-2] if booking.centre else 'KRN'}-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

    weighment = db.query(Weighment).filter(Weighment.booking_id == req.booking_id).first()
    if not weighment:
        weighment = Weighment(
            id=f"wgh-{uuid.uuid4().hex[:8]}",
            booking_id=req.booking_id,
            operator_id=req.operator_id or "usr-off-01",
            weighbridge_slip_no=slip_no,
            gross_weight_quintals=req.gross_weight_quintals,
            tare_weight_quintals=req.tare_weight_quintals,
            net_weight_quintals=net_weight,
            bag_count=req.bag_count
        )
        db.add(weighment)
    else:
        weighment.gross_weight_quintals = req.gross_weight_quintals
        weighment.tare_weight_quintals = req.tare_weight_quintals
        weighment.net_weight_quintals = net_weight
        weighment.bag_count = req.bag_count

    # Update booking status
    booking_service.update_booking_status(db, booking.id, BookingStatus.PROCUREMENT_COMPLETED)

    # Initialize DBT payment record
    msp = booking.crop.msp_rate_per_quintal if booking.crop else 2275.0
    calc = payment_service.calculate_payment(net_weight, msp)

    existing_pay = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if not existing_pay:
        pay = Payment(
            id=f"pay-{uuid.uuid4().hex[:8]}",
            booking_id=booking.id,
            farmer_id=booking.farmer_id,
            msp_rate=msp,
            net_quantity_quintals=net_weight,
            gross_amount=calc["gross_amount"],
            deductions=0.0,
            net_payable_amount=calc["net_payable_amount"],
            status="PAYMENT_PROCESSING"
        )
        db.add(pay)

    db.commit()
    db.refresh(weighment)

    return {
        "success": True,
        "weighbridge_slip_no": weighment.weighbridge_slip_no,
        "net_weight_quintals": net_weight,
        "bag_count": weighment.bag_count,
        "status": BookingStatus.PROCUREMENT_COMPLETED,
        "next_step": "DBT_PAYMENT_SETTLEMENT",
        "estimated_payout_inr": calc["net_payable_amount"]
    }

@router.get("/booking/{booking_id}")
def get_weighment_for_booking(booking_id: str, db: Session = Depends(get_db)):
    w = db.query(Weighment).filter(Weighment.booking_id == booking_id).first()
    if not w:
        return None
    return {
        "id": w.id,
        "slip_no": w.weighbridge_slip_no,
        "gross_weight": w.gross_weight_quintals,
        "tare_weight": w.tare_weight_quintals,
        "net_weight": w.net_weight_quintals,
        "bag_count": w.bag_count,
        "weighed_at": w.weighed_at.isoformat() if w.weighed_at else None
    }
