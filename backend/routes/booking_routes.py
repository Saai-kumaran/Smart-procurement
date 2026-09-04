"""Booking and Scheduling Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from backend.models import get_db, Booking, BookingStatus
from backend.services.scheduling_service import scheduling_service
from backend.services.booking_service import booking_service
from backend.services.geofence_service import geofence_service
from backend.services.notification_service import notification_service

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

class RecommendSlotsRequest(BaseModel):
    farmer_id: str
    crop_id: str
    preferred_centre_id: Optional[str] = None

class ConfirmBookingRequest(BaseModel):
    farmer_id: str
    centre_id: str
    slot_id: str
    crop_id: str
    distance_km: Optional[float] = 10.0
    estimated_travel_minutes: Optional[float] = 25.0
    weather_risk_level: Optional[str] = "LOW"
    crop_maturity_score: Optional[float] = 85.0

class GeofenceCheckRequest(BaseModel):
    latitude: float
    longitude: float

class StatusUpdateRequest(BaseModel):
    new_status: str
    reason: Optional[str] = None

@router.post("/recommend-slots")
async def recommend_slots(req: RecommendSlotsRequest, db: Session = Depends(get_db)):
    try:
        result = await scheduling_service.recommend_slots_for_farmer(
            db,
            farmer_id=req.farmer_id,
            crop_id=req.crop_id,
            preferred_centre_id=req.preferred_centre_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/confirm")
async def confirm_booking(req: ConfirmBookingRequest, db: Session = Depends(get_db)):
    try:
        booking = booking_service.create_booking(
            db,
            farmer_id=req.farmer_id,
            centre_id=req.centre_id,
            slot_id=req.slot_id,
            crop_id=req.crop_id,
            distance_km=req.distance_km or 10.0,
            estimated_travel_minutes=req.estimated_travel_minutes or 25.0,
            weather_risk_level=req.weather_risk_level or "LOW",
            crop_maturity_score=req.crop_maturity_score or 85.0
        )

        # Dispatch confirmation notification (SMS, Push, IVR script)
        slot_str = f"{booking.slot.slot_date} {booking.slot.start_time}"
        farmer_user = booking.farmer.user if booking.farmer else None
        phone = booking.farmer.primary_phone if booking.farmer else "9876543210"

        notif_res = await notification_service.send_procurement_confirmation(
            db,
            user_id=farmer_user.id if farmer_user else "usr-farm-01",
            phone=phone,
            booking_token=booking.booking_token,
            centre_name=booking.centre.centre_name,
            slot_time=slot_str,
            preferred_lang=booking.farmer.preferred_language if booking.farmer else "hi"
        )

        return {
            "success": True,
            "booking_id": booking.id,
            "booking_token": booking.booking_token,
            "qr_token": booking.qr_token,
            "status": booking.status,
            "token_number": booking.queue_entry.token_number if booking.queue_entry else 101,
            "centre_name": booking.centre.centre_name,
            "slot_date": booking.slot.slot_date.isoformat(),
            "slot_time": f"{booking.slot.start_time} - {booking.slot.end_time}",
            "notification": notif_res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/farmer/{farmer_id}")
def list_farmer_bookings(farmer_id: str, db: Session = Depends(get_db)):
    bookings = booking_service.get_farmer_bookings(db, farmer_id)
    out = []
    for b in bookings:
        out.append({
            "id": b.id,
            "booking_token": b.booking_token,
            "status": b.status,
            "qr_token": b.qr_token,
            "centre_name": b.centre.centre_name,
            "centre_id": b.centre.id,
            "slot_date": b.slot.slot_date.isoformat(),
            "slot_time": f"{b.slot.start_time} - {b.slot.end_time}",
            "crop_name": b.crop.crop_name,
            "quantity_quintals": b.booked_quantity_quintals,
            "weather_risk_level": b.weather_risk_level,
            "distance_km": b.distance_km,
            "token_number": b.queue_entry.token_number if b.queue_entry else None,
            "estimated_wait_minutes": b.queue_entry.estimated_wait_minutes if b.queue_entry else 0
        })
    return out

@router.get("/{booking_id}")
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    b = booking_service.get_booking_details(db, booking_id)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "id": b.id,
        "booking_token": b.booking_token,
        "status": b.status,
        "qr_token": b.qr_token,
        "centre_name": b.centre.centre_name,
        "centre_id": b.centre.id,
        "centre_phone": b.centre.contact_phone,
        "farmer_name": b.farmer.user.full_name if b.farmer and b.farmer.user else "",
        "farmer_phone": b.farmer.primary_phone if b.farmer else "",
        "slot_date": b.slot.slot_date.isoformat(),
        "slot_time": f"{b.slot.start_time} - {b.slot.end_time}",
        "crop_name": b.crop.crop_name,
        "quantity_quintals": b.booked_quantity_quintals,
        "weather_risk_level": b.weather_risk_level,
        "token_number": b.queue_entry.token_number if b.queue_entry else None,
        "current_stage": b.queue_entry.current_stage if b.queue_entry else None,
        "estimated_wait_minutes": b.queue_entry.estimated_wait_minutes if b.queue_entry else 0,
        "created_at": b.created_at.isoformat() if b.created_at else None
    }

@router.post("/{booking_id}/check-in")
def check_in_geofence(booking_id: str, req: GeofenceCheckRequest, db: Session = Depends(get_db)):
    result = geofence_service.check_farmer_arrival(
        db, booking_id=booking_id, farmer_lat=req.latitude, farmer_lon=req.longitude
    )
    return result

@router.patch("/{booking_id}/status")
def update_status(booking_id: str, req: StatusUpdateRequest, db: Session = Depends(get_db)):
    try:
        updated = booking_service.update_booking_status(
            db, booking_id=booking_id, new_status=req.new_status, reason=req.reason
        )
        return {
            "success": True,
            "booking_id": updated.id,
            "status": updated.status,
            "message": f"Status updated to {updated.status}."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
