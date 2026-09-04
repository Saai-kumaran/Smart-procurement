"""Booking controller orchestrating reservations and passes."""
from sqlalchemy.orm import Session
from backend.services.booking_service import booking_service

class BookingController:
    @staticmethod
    def get_booking(db: Session, booking_id: str):
        return booking_service.get_booking_details(db, booking_id)

    @staticmethod
    def list_farmer_bookings(db: Session, farmer_id: str):
        return booking_service.get_farmer_bookings(db, farmer_id)

booking_controller = BookingController()
