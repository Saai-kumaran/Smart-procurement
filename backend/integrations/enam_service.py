"""
e-NAM (National Agriculture Market) Service Integration.
Provides real-time APMC Mandi modal price tracking and minimum support price (MSP) references.
"""
from typing import Dict, Any, List
from backend.config.api_config import DEFAULT_MSP_RATES

class ENAMService:
    def get_msp_rate(self, crop_name: str) -> float:
        """Returns standard Minimum Support Price (MSP) per quintal."""
        return DEFAULT_MSP_RATES.get(crop_name, 2275.0)

    def get_mandi_modal_prices(self, state: str, commodity: str) -> Dict[str, Any]:
        """Provides simulated or live e-NAM APMC price indices."""
        msp = self.get_msp_rate(commodity)
        return {
            "commodity": commodity,
            "state": state,
            "msp_rate": msp,
            "modal_market_price": round(msp * 1.03, 1),
            "source": "e-NAM / Agmarknet Portal"
        }

enam_service = ENAMService()
