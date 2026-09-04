"""
Queue Management Business Service.
Provides live queue ordering, waiting time predictions, and stage transitions.
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.models import QueueEntry, Booking, BookingStatus, ProcurementCentre
from backend.algorithms.queue_prediction import predict_queue_waiting_time

class QueueService:
    def get_centre_queue(self, db: Session, centre_id: str) -> Dict[str, Any]:
        """Returns live active queue for a procurement centre."""
        centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
        entries = db.query(QueueEntry).join(Booking).filter(
            QueueEntry.centre_id == centre_id,
            Booking.status.in_([
                BookingStatus.ARRIVED,
                BookingStatus.CHECKED_IN,
                BookingStatus.INSPECTION,
                BookingStatus.QUALITY_CHECK,
                BookingStatus.WEIGHING
            ])
        ).order_by(QueueEntry.token_number.asc()).all()

        queue_items = []
        for i, qe in enumerate(entries):
            b = qe.booking
            wait_info = predict_queue_waiting_time(
                queue_position=i + 1,
                vehicles_ahead=i,
                hourly_processing_capacity=centre.hourly_capacity_quintals if centre else 150.0,
                current_stage=qe.current_stage
            )
            queue_items.append({
                "queue_entry_id": qe.id,
                "token_number": qe.token_number,
                "booking_id": b.id,
                "booking_token": b.booking_token,
                "farmer_name": b.farmer.user.full_name if b.farmer and b.farmer.user else "Farmer",
                "crop_name": b.crop.crop_name if b.crop else "Grain",
                "quantity_quintals": b.booked_quantity_quintals,
                "status": b.status,
                "current_stage": qe.current_stage,
                "estimated_wait_minutes": wait_info["estimated_wait_minutes"],
                "entry_time": qe.entry_time.isoformat() if qe.entry_time else None
            })

        return {
            "centre_id": centre_id,
            "centre_name": centre.centre_name if centre else "Mandi",
            "active_queue_count": len(queue_items),
            "queue": queue_items
        }

    def get_farmer_queue_position(self, db: Session, booking_id: str) -> Dict[str, Any]:
        """Calculates exact queue position and estimated wait time for a specific farmer's booking."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking or not booking.queue_entry:
            return {"position": 0, "estimated_wait_minutes": 0, "status": booking.status if booking else "UNKNOWN"}

        qe = booking.queue_entry
        ahead_count = db.query(QueueEntry).join(Booking).filter(
            QueueEntry.centre_id == booking.centre_id,
            QueueEntry.token_number < qe.token_number,
            Booking.status.in_([BookingStatus.ARRIVED, BookingStatus.CHECKED_IN, BookingStatus.INSPECTION, BookingStatus.WEIGHING])
        ).count()

        centre = booking.centre
        wait_info = predict_queue_waiting_time(
            queue_position=ahead_count + 1,
            vehicles_ahead=ahead_count,
            hourly_processing_capacity=centre.hourly_capacity_quintals if centre else 150.0,
            current_stage=qe.current_stage
        )

        return {
            "booking_id": booking.id,
            "token_number": qe.token_number,
            "position": ahead_count + 1,
            "vehicles_ahead": ahead_count,
            "estimated_wait_minutes": wait_info["estimated_wait_minutes"],
            "current_stage": qe.current_stage,
            "status": booking.status,
            "centre_name": centre.centre_name if centre else "Mandi"
        }

queue_service = QueueService()
