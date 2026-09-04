"""Quality Assessment and Inspection Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import uuid

from backend.models import get_db, Booking, BookingStatus, Inspection, User
from backend.services.booking_service import booking_service

router = APIRouter(prefix="/api/inspections", tags=["Quality Inspection"])

class InspectionSubmitRequest(BaseModel):
    booking_id: str
    officer_id: Optional[str] = "usr-off-01"
    moisture_percentage: float
    foreign_matter_percentage: float
    damaged_grains_percentage: Optional[float] = 0.5
    quality_grade: str = "GRADE_A"  # GRADE_A, GRADE_B, GRADE_C, REJECTED
    remarks: Optional[str] = None

@router.post("")
def submit_inspection(req: InspectionSubmitRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # If moisture is over 14%, warn or reject
    status_result = "APPROVED"
    if req.quality_grade == "REJECTED" or req.moisture_percentage > 15.0:
        status_result = "REJECTED"
        booking_service.update_booking_status(db, booking.id, BookingStatus.CANCELLED, reason="Rejected: Excessive moisture content")
    else:
        # Move to weighing stage
        booking_service.update_booking_status(db, booking.id, BookingStatus.WEIGHING)

    inspection = db.query(Inspection).filter(Inspection.booking_id == req.booking_id).first()
    if not inspection:
        inspection = Inspection(
            id=f"insp-{uuid.uuid4().hex[:8]}",
            booking_id=req.booking_id,
            officer_id=req.officer_id or "usr-off-01",
            moisture_percentage=req.moisture_percentage,
            foreign_matter_percentage=req.foreign_matter_percentage,
            damaged_grains_percentage=req.damaged_grains_percentage or 0.5,
            quality_grade=req.quality_grade,
            inspection_status=status_result,
            remarks=req.remarks
        )
        db.add(inspection)
    else:
        inspection.moisture_percentage = req.moisture_percentage
        inspection.foreign_matter_percentage = req.foreign_matter_percentage
        inspection.quality_grade = req.quality_grade
        inspection.remarks = req.remarks
        inspection.inspection_status = status_result

    db.commit()
    db.refresh(inspection)

    return {
        "success": True,
        "inspection_id": inspection.id,
        "quality_grade": inspection.quality_grade,
        "status": status_result,
        "next_stage": "WEIGHING" if status_result == "APPROVED" else "REJECTED",
        "message": f"Inspection recorded. Quality Grade: {inspection.quality_grade}."
    }

@router.get("/booking/{booking_id}")
def get_inspection_for_booking(booking_id: str, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.booking_id == booking_id).first()
    if not insp:
        return None
    return {
        "id": insp.id,
        "moisture_percentage": insp.moisture_percentage,
        "foreign_matter_percentage": insp.foreign_matter_percentage,
        "damaged_grains_percentage": insp.damaged_grains_percentage,
        "quality_grade": insp.quality_grade,
        "status": insp.inspection_status,
        "remarks": insp.remarks,
        "inspected_at": insp.inspected_at.isoformat() if insp.inspected_at else None
    }
