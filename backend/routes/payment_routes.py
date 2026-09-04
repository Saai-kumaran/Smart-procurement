"""Direct Benefit Transfer (DBT) Payment Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from backend.models import get_db, Payment, Booking, BookingStatus, Farmer
from backend.integrations.payment_service import payment_service
from backend.services.booking_service import booking_service

router = APIRouter(prefix="/api/payments", tags=["Payments"])

class SettlePaymentRequest(BaseModel):
    booking_id: str

@router.get("/booking/{booking_id}")
def get_payment_for_booking(booking_id: str, db: Session = Depends(get_db)):
    pay = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not pay:
        # Check if booking is completed and generate preview
        b = db.query(Booking).filter(Booking.id == booking_id).first()
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        msp = b.crop.msp_rate_per_quintal if b.crop else 2275.0
        q = b.booked_quantity_quintals
        calc = payment_service.calculate_payment(q, msp)
        return {
            "booking_id": b.id,
            "status": "ESTIMATED",
            "msp_rate": msp,
            "net_quantity_quintals": q,
            "gross_amount": calc["gross_amount"],
            "net_payable_amount": calc["net_payable_amount"],
            "dbt_transaction_ref": "Pending Weighment & Inspection"
        }

    return {
        "id": pay.id,
        "booking_id": pay.booking_id,
        "farmer_id": pay.farmer_id,
        "msp_rate": pay.msp_rate,
        "net_quantity_quintals": pay.net_quantity_quintals,
        "gross_amount": pay.gross_amount,
        "deductions": pay.deductions,
        "net_payable_amount": pay.net_payable_amount,
        "dbt_transaction_ref": pay.dbt_transaction_ref,
        "payment_mode": pay.payment_mode,
        "status": pay.status,
        "settled_at": pay.settled_at.isoformat() if pay.settled_at else None
    }

@router.post("/settle")
def settle_dbt_payment(req: SettlePaymentRequest, db: Session = Depends(get_db)):
    pay = db.query(Payment).filter(Payment.booking_id == req.booking_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payment record not found for this booking")

    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    farmer = booking.farmer if booking else None

    # Process via simulated PFMS / APBS
    res = payment_service.process_dbt_settlement(
        farmer_id=pay.farmer_id,
        bank_account=farmer.bank_account_no if farmer else "",
        amount=pay.net_payable_amount,
        booking_token=booking.booking_token if booking else ""
    )

    pay.dbt_transaction_ref = res["dbt_transaction_ref"]
    pay.status = "PAYMENT_SETTLED"
    pay.settled_at = datetime.utcnow()

    # Update booking state machine
    booking_service.update_booking_status(db, req.booking_id, BookingStatus.PAYMENT_SETTLED)

    db.commit()
    db.refresh(pay)

    return {
        "success": True,
        "status": "PAYMENT_SETTLED",
        "dbt_transaction_ref": pay.dbt_transaction_ref,
        "amount_inr": pay.net_payable_amount,
        "settled_at": pay.settled_at.isoformat(),
        "message": f"Direct Benefit Transfer of Rs. {pay.net_payable_amount:,.2f} settled successfully."
    }
