"""
Harvest and Weather Risk Assessment Algorithm.
Evaluates microclimate weather risks for harvesting operations, open transit,
and mandi yard operations.
"""
from typing import Dict, Any, List, Optional

def calculate_weather_risk(
    temperature: float,
    rainfall_mm: float,
    humidity_pct: float,
    wind_speed_kmh: float = 12.0,
    forecast_condition: str = "Clear Sky"
) -> Dict[str, Any]:
    """
    Computes weather risk index (0.0 to 1.0) and categorical risk level:
    - LOW: Minimal weather risk; ideal harvesting and transport window.
    - MEDIUM: Moderate cloud cover or light drizzle (< 10mm); cautious transit.
    - HIGH: Severe rainfall (> 25mm), storm, or extreme winds; danger of grain spoilage.
    """
    risk_score = 0.0
    risk_factors = []

    # 1. Rainfall Impact (Most critical for harvest & moisture limits)
    if rainfall_mm >= 25.0:
        risk_score += 0.65
        risk_factors.append(f"Heavy precipitation expected ({rainfall_mm:.1f} mm)")
    elif rainfall_mm >= 10.0:
        risk_score += 0.40
        risk_factors.append(f"Moderate rainfall expected ({rainfall_mm:.1f} mm)")
    elif rainfall_mm >= 2.0:
        risk_score += 0.18
        risk_factors.append(f"Light localized drizzle ({rainfall_mm:.1f} mm)")

    # 2. Humidity Impact (Affects grain moisture > 12-14% rejection risk)
    if humidity_pct >= 85.0:
        risk_score += 0.20
        risk_factors.append(f"Excess humidity ({humidity_pct:.0f}%), elevating grain moisture risk")
    elif humidity_pct >= 70.0:
        risk_score += 0.10

    # 3. Extreme Temperatures (Heat stress or grain drying issues)
    if temperature >= 42.0:
        risk_score += 0.15
        risk_factors.append(f"Severe heatwave conditions ({temperature:.1f} °C)")
    elif temperature <= 4.0:
        risk_score += 0.15
        risk_factors.append(f"Cold frost conditions ({temperature:.1f} °C)")

    # 4. Wind Speed
    if wind_speed_kmh >= 45.0:
        risk_score += 0.20
        risk_factors.append(f"High wind gusts ({wind_speed_kmh:.1f} km/h)")

    # Clamp risk score to [0.0, 1.0]
    final_risk = min(1.0, risk_score)

    if final_risk >= 0.55:
        level = "HIGH"
        advisory = "High weather risk: Postpone harvesting and outdoor mandi transport to avoid grain wetting."
    elif final_risk >= 0.25:
        level = "MEDIUM"
        advisory = "Moderate weather risk: Ensure tarpaulin coverings during transport; prioritize early morning slots."
    else:
        level = "LOW"
        advisory = "Favorable weather: Optimal window for field harvest and mandi procurement."

    return {
        "risk_level": level,
        "risk_score": round(final_risk, 2),
        "temperature": temperature,
        "rainfall_mm": rainfall_mm,
        "humidity_pct": humidity_pct,
        "condition": forecast_condition,
        "factors": risk_factors,
        "advisory": advisory
    }
