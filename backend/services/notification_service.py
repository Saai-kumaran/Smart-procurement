"""
Unified Multi-Channel Notification Service.
Dispatches alerts across SMS, Push (FCM), IVR, and In-App channels.
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

from backend.models import Notification
from backend.integrations.sms_service import sms_service
from backend.integrations.fcm_service import fcm_service
from backend.integrations.ivr_service import ivr_service
from backend.integrations.bhashini_service import bhashini_service

class NotificationService:
    async def send_procurement_confirmation(
        self,
        db: Session,
        user_id: str,
        phone: str,
        booking_token: str,
        centre_name: str,
        slot_time: str,
        preferred_lang: str = "hi"
    ) -> Dict[str, Any]:
        """Dispatches multi-channel notification for confirmed booking."""
        sms_msg = f"SIH26032: Your slot is confirmed. Token: {booking_token}, Centre: {centre_name}, Time: {slot_time}. Carry your digital QR pass."
        voice_info = bhashini_service.generate_voice_script(booking_token, centre_name, slot_time, preferred_lang)

        # 1. SMS
        sms_res = await sms_service.send_sms(phone, sms_msg)

        # 2. Push Notification
        push_res = await fcm_service.send_push_notification(
            device_token=phone,
            title="Slot Confirmed / स्लॉट आरक्षित",
            body=sms_msg
        )

        # 3. Log to Database
        db_notif = Notification(
            id=f"ntf-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            channel="SMS",
            title="Slot Booking Confirmation",
            message=sms_msg,
            status="SENT"
        )
        db.add(db_notif)
        db.commit()

        return {
            "sms": sms_res,
            "push": push_res,
            "voice_script": voice_info["voice_script"],
            "status": "DISPATCHED"
        }

notification_service = NotificationService()
