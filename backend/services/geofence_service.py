"""
Geofencing and Auto-Arrival Check-in Service.
Compares real-time farmer GPS coordinates against procurement centre boundary.
Triggers automatic entry check-in when farmer enters geofence radius.
"""
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.models import Booking, BookingStatus, ProcurementCentre
from backend.integrations.map_service import map_service
from backend.services.booking_service import booking_service

class GeofenceService:
    def check_farmer_arrival(
        self,
        db: Session,
        booking_id: str,
        farmer_lat: float,
        farmer_lon: float
    ) -> Dict[str, Any]:
        """
        Evaluates proximity to mandi gate.
        If distance <= centre.geofence_radius_meters, transition to CHECKED_IN.
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"inside": False, "message": "Booking not found."}

        centre = booking.centre
        if not centre:
            return {"inside": False, "message": "Centre not found."}

        distance_km = map_service.haversine_distance_km(farmer_lat, farmer_lon, centre.latitude, centre.longitude)
        distance_meters = distance_km * 1000.0

        is_inside = distance_meters <= centre.geofence_radius_meters

        if is_inside and booking.status == BookingStatus.BOOKED:
            # Auto check-in
            booking_service.update_booking_status(db, booking.id, BookingStatus.CHECKED_IN)
            return {
                "inside": True,
                "distance_meters": round(distance_meters, 1),
                "geofence_radius_meters": centre.geofence_radius_meters,
                "status": BookingStatus.CHECKED_IN,
                "message": f"Welcome to {centre.centre_name}! You have been automatically checked in. Proceed to Gate Entry."
            }

        return {
            "inside": is_inside,
            "distance_meters": round(distance_meters, 1),
            "geofence_radius_meters": centre.geofence_radius_meters,
            "current_status": booking.status,
            "message": f"{round(distance_km, 2)} km away from {centre.centre_name}."
        }

geofence_service = GeofenceService()
