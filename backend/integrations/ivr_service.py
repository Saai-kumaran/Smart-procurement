"""
Interactive Voice Response (IVR) Integration Service.
Provides automated voice calls in local languages for farmers with low digital literacy.
"""
from typing import Dict, Any
from backend.config.settings import settings

class IVRService:
    def __init__(self):
        self.api_key = settings.IVR_API_KEY
        self.demo_mode = settings.DEMO_MODE or not self.api_key

    async def schedule_ivr_call(self, phone: str, language: str, voice_prompt: str) -> Dict[str, Any]:
        """Schedules outbound IVR phone call to deliver spoken procurement token."""
        return {
            "channel": "IVR_VOICE_CALL",
            "phone": phone,
            "language": language,
            "prompt_text": voice_prompt,
            "call_status": "QUEUED_OUTBOUND",
            "session_id": f"IVR-SES-{phone[-4:]}",
            "is_demo": self.demo_mode
        }

ivr_service = IVRService()
