"""
Weather Monitoring & Pre-Harvest Alert Service.
Re-evaluates weather forecasts for all upcoming bookings within 1-48 hours.
Flags extreme weather risks and recommends alternative dry-window slots.
"""
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict, Any

from backend.models import Booking, BookingStatus, Slot, ProcurementCentre
from backend.integrations.weather_service import weather_service
from backend.services.scheduling_service import scheduling_service

class WeatherMonitor:
    async def scan_upcoming_bookings_for_weather_risks(self, db: Session) -> List[Dict[str, Any]]:
        """
        Scans all confirmed upcoming bookings.
        If weather risk on slot date is HIGH, flags the booking for emergency reschedule.
        """
        today = date.today()
        upcoming_bookings = db.query(Booking).join(Slot).filter(
            Booking.status.in_([BookingStatus.BOOKED, BookingStatus.RESCHEDULED]),
            Slot.slot_date >= today,
            Slot.slot_date <= today + timedelta(days=3)
        ).all()

        at_risk_bookings = []

        for bkg in upcoming_bookings:
            centre = bkg.centre
            forecasts = await weather_service.get_7day_forecast(centre.latitude, centre.longitude)
            slot_date_str = bkg.slot.slot_date.isoformat()

            # Find matching day forecast
            day_fc = next((f for f in forecasts if f["date"] == slot_date_str), None)
            if day_fc and day_fc["risk_level"] == "HIGH":
                # Find alternative recommendations
                alt_recs = []
                try:
                    recs = await scheduling_service.recommend_slots_for_farmer(
                        db, bkg.farmer_id, bkg.crop_id, preferred_centre_id=bkg.centre_id
                    )
                    # Filter out the risky date
                    alt_recs = [r for r in recs.get("recommendations", []) if r["slot_date"] != slot_date_str][:2]
                except Exception:
                    pass

                at_risk_bookings.append({
                    "booking_id": bkg.id,
                    "booking_token": bkg.booking_token,
                    "farmer_name": bkg.farmer.user.full_name if bkg.farmer and bkg.farmer.user else "Farmer",
                    "phone": bkg.farmer.primary_phone if bkg.farmer else "",
                    "centre_name": centre.centre_name,
                    "current_slot_date": slot_date_str,
                    "weather_hazard": day_fc["condition"],
                    "rainfall_mm": day_fc["rainfall_mm"],
                    "risk_level": "HIGH",
                    "recommended_alternatives": alt_recs,
                    "advisory": "Severe weather alert: Torrential rain forecast. Early rescheduling advised to protect crop quality."
                })

        return at_risk_bookings

weather_monitor = WeatherMonitor()
