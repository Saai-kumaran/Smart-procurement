"""Notification and Bhashini Voice Guidance Endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.models import get_db, Notification
from backend.integrations.bhashini_service import bhashini_service
from backend.services.weather_monitor import weather_monitor

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Voice"])

@router.get("/user/{user_id}")
def list_user_notifications(user_id: str, db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.sent_at.desc()).all()
    return [
        {
            "id": n.id,
            "channel": n.channel,
            "title": n.title,
            "message": n.message,
            "status": n.status,
            "sent_at": n.sent_at.isoformat() if n.sent_at else None
        }
        for n in notifs
    ]

@router.get("/voice-script")
def get_voice_script(
    booking_token: str = Query(...),
    centre_name: str = Query(...),
    slot_time: str = Query(...),
    lang: str = Query("hi")
):
    """Generates localized Bhashini voice text for spoken token readout."""
    return bhashini_service.generate_voice_script(booking_token, centre_name, slot_time, lang)

@router.get("/languages")
def get_supported_languages():
    return bhashini_service.get_supported_languages()

@router.post("/weather-alerts/scan")
async def scan_weather_alerts(db: Session = Depends(get_db)):
    """Triggers proactive scan of upcoming bookings against 1-48h weather forecasts."""
    alerts = await weather_monitor.scan_upcoming_bookings_for_weather_risks(db)
    return {
        "scanned_count": len(alerts),
        "at_risk_bookings": alerts
    }
