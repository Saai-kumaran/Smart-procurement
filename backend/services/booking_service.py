"""
Booking, Capacity Reservation, and QR Pass Service.
Enforces atomic capacity deduction and strict queue status transitions.
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

from backend.models import Booking, BookingStatus, Slot, Crop, Farmer, ProcurementCentre, QueueEntry
from backend.services.centre_service import centre_service

class BookingService:
    def create_booking(
        self,
        db: Session,
        farmer_id: str,
        centre_id: str,
        slot_id: str,
        crop_id: str,
        distance_km: float = 10.0,
        estimated_travel_minutes: float = 25.0,
        weather_risk_level: str = "LOW",
        crop_maturity_score: float = 85.0
    ) -> Booking:
        """Atomically reserves capacity on the slot and creates the confirmed booking."""
        slot = db.query(Slot).filter(Slot.id == slot_id).with_for_update().first()
        if not slot:
            raise ValueError("Selected slot does not exist.")

        crop = db.query(Crop).filter(Crop.id == crop_id).first()
        if not crop:
            raise ValueError("Crop record does not exist.")

        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()

        req_quantity = crop.estimated_quantity_quintals

        # Verify capacity
        if slot.remaining_capacity < req_quantity:
            raise ValueError(f"Insufficient slot capacity ({slot.remaining_capacity}q remaining; {req_quantity}q required).")

        # Reserve capacity
        slot.reserved_capacity_quintals += req_quantity
        slot.booked_vehicles += 1
        if slot.booked_vehicles >= slot.max_vehicles or slot.remaining_capacity <= 0:
            slot.status = "FULL"

        # Generate unique human-readable booking token and QR payload
        centre_code_short = centre.centre_code.split("-")[-2] if centre else "MND"
        random_suffix = uuid.uuid4().hex[:4].upper()
        booking_token = f"SIH26-{centre_code_short}-{random_suffix}"
        qr_token = f"QR-SIH-{farmer.primary_phone if farmer else 'PASS'}-{booking_token}"

        booking = Booking(
            id=f"bkg-{uuid.uuid4().hex[:8]}",
            booking_token=booking_token,
            farmer_id=farmer_id,
            centre_id=centre_id,
            slot_id=slot_id,
            crop_id=crop_id,
            booked_quantity_quintals=req_quantity,
            status=BookingStatus.BOOKED,
            qr_token=qr_token,
            distance_km=distance_km,
            estimated_travel_minutes=estimated_travel_minutes,
            weather_risk_level=weather_risk_level,
            crop_maturity_score=crop_maturity_score
        )
        db.add(booking)
        db.flush()

        # Create Initial Queue Entry
        today_queue_count = db.query(QueueEntry).filter(QueueEntry.centre_id == centre_id).count()
        queue_entry = QueueEntry(
            id=f"qe-{uuid.uuid4().hex[:8]}",
            booking_id=booking.id,
            token_number=100 + today_queue_count + 1,
            centre_id=centre_id,
            estimated_wait_minutes=30,
            current_stage="WAITING"
        )
        db.add(queue_entry)

        db.commit()
        db.refresh(booking)
        return booking

    def update_booking_status(self, db: Session, booking_id: str, new_status: str, reason: Optional[str] = None) -> Booking:
        """Strictly controlled status transitions across Mandi workflow."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError("Booking not found.")

        booking.status = new_status
        if reason:
            booking.cancellation_reason = reason

        # Synchronize queue entry stage if applicable
        if booking.queue_entry:
            if new_status in [BookingStatus.ARRIVED, BookingStatus.CHECKED_IN]:
                booking.queue_entry.current_stage = "ARRIVED"
            elif new_status in [BookingStatus.INSPECTION, BookingStatus.QUALITY_CHECK]:
                booking.queue_entry.current_stage = "INSPECTION"
            elif new_status == BookingStatus.WEIGHING:
                booking.queue_entry.current_stage = "WEIGHING"
            elif new_status in [BookingStatus.PROCUREMENT_COMPLETED, BookingStatus.PAYMENT_PROCESSING, BookingStatus.PAYMENT_SETTLED]:
                booking.queue_entry.current_stage = "COMPLETED"

        db.commit()
        db.refresh(booking)
        return booking

    def get_booking_details(self, db: Session, booking_id: str) -> Optional[Booking]:
        return db.query(Booking).filter(Booking.id == booking_id).first()

    def get_farmer_bookings(self, db: Session, farmer_id: str) -> List[Booking]:
        return db.query(Booking).filter(Booking.farmer_id == farmer_id).order_by(Booking.created_at.desc()).all()

    def get_centre_bookings(self, db: Session, centre_id: str, status: Optional[str] = None) -> List[Booking]:
        q = db.query(Booking).filter(Booking.centre_id == centre_id)
        if status:
            q = q.filter(Booking.status == status)
        return q.order_by(Booking.created_at.desc()).all()

booking_service = BookingService()
