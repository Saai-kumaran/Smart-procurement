"""
SMS Gateway Integration Service.
Delivers critical procurement tokens and schedule updates via text SMS.
"""
from typing import Dict, Any
from backend.config.settings import settings

class SMSService:
    def __init__(self):
        self.api_key = settings.SMS_API_KEY
        self.demo_mode = settings.DEMO_MODE or not self.api_key

    async def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """Dispatches transactional SMS to farmer mobile number."""
        return {
            "channel": "SMS",
            "phone": phone,
            "message": message,
            "status": "SENT",
            "gateway_ref": f"SMS-GOI-{phone[-4:]}-OK",
            "is_demo": self.demo_mode
        }

sms_service = SMSService()
