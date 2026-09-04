"""Procurement Centre and Slot Management Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import date

from backend.models import get_db, ProcurementCentre, Slot, Booking, BookingStatus
from backend.services.centre_service import centre_service

router = APIRouter(prefix="/api/centres", tags=["Procurement Centres"])

@router.get("")
def list_centres(district: Optional[str] = None, db: Session = Depends(get_db)):
    centres = centre_service.list_active_centres(db, district=district)
    return [
        {
            "id": c.id,
            "centre_code": c.centre_code,
            "centre_name": c.centre_name,
            "district": c.district,
            "state": c.state,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "daily_capacity_quintals": c.daily_capacity_quintals,
            "hourly_capacity_quintals": c.hourly_capacity_quintals,
            "operating_hours": f"{c.operating_hours_start} - {c.operating_hours_end}",
            "contact_phone": c.contact_phone
        }
        for c in centres
    ]

@router.get("/{centre_id}")
def get_centre(centre_id: str, db: Session = Depends(get_db)):
    c = centre_service.get_centre_by_id(db, centre_id)
    if not c:
        raise HTTPException(status_code=404, detail="Centre not found")

    # Today's metrics
    today = date.today()
    today_bookings = db.query(Booking).join(Slot).filter(
        Booking.centre_id == centre_id,
        Slot.slot_date == today
    ).all()

    today_booked_q = sum(b.booked_quantity_quintals for b in today_bookings if b.status != BookingStatus.CANCELLED)
    utilization_pct = min(100.0, round((today_booked_q / max(1.0, c.daily_capacity_quintals)) * 100.0, 1))

    return {
        "id": c.id,
        "centre_code": c.centre_code,
        "centre_name": c.centre_name,
        "district": c.district,
        "state": c.state,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "daily_capacity_quintals": c.daily_capacity_quintals,
        "hourly_capacity_quintals": c.hourly_capacity_quintals,
        "geofence_radius_meters": c.geofence_radius_meters,
        "operating_hours": f"{c.operating_hours_start} - {c.operating_hours_end}",
        "contact_phone": c.contact_phone,
        "today_booked_quintals": today_booked_q,
        "utilization_pct": utilization_pct,
        "today_bookings_count": len(today_bookings)
    }

@router.get("/{centre_id}/slots")
def get_centre_slots(centre_id: str, days_ahead: int = 7, db: Session = Depends(get_db)):
    slots = centre_service.get_or_generate_slots_for_centre(db, centre_id, days_ahead=days_ahead)
    return [
        {
            "id": s.id,
            "slot_date": s.slot_date.isoformat(),
            "start_time": s.start_time,
            "end_time": s.end_time,
            "time_window": f"{s.start_time} - {s.end_time}",
            "max_capacity_quintals": s.max_capacity_quintals,
            "reserved_capacity_quintals": s.reserved_capacity_quintals,
            "remaining_capacity": s.remaining_capacity,
            "max_vehicles": s.max_vehicles,
            "booked_vehicles": s.booked_vehicles,
            "status": s.status,
            "is_available": s.is_available
        }
        for s in slots
    ]
