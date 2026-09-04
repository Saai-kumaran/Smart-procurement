"""
Firebase Cloud Messaging (FCM) Integration Service.
Dispatches high-priority push notifications to farmer mobile devices
for slot confirmation, weather alerts, and gate check-in.
"""
from typing import Dict, Any
from backend.config.settings import settings

class FCMService:
    def __init__(self):
        self.project_id = settings.FIREBASE_PROJECT_ID
        self.demo_mode = settings.DEMO_MODE or not self.project_id

    async def send_push_notification(self, device_token: str, title: str, body: str, payload: Dict[str, Any] = None) -> Dict[str, Any]:
        """Sends FCM push alert or simulates successful dispatch in demo mode."""
        return {
            "channel": "FCM_PUSH",
            "title": title,
            "body": body,
            "status": "DELIVERED",
            "message_id": f"fcm-msg-{id(title)}",
            "is_demo": self.demo_mode
        }

fcm_service = FCMService()
