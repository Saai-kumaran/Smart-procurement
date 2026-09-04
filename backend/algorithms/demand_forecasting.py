"""
Historical Demand and Mandi Arrival Forecasting Algorithm.
Predicts expected arrival volumes (in quintals and vehicle counts) for upcoming days
by synthesizing historical seasonal patterns, active catchment registrations, and weather impacts.
"""
from datetime import date, timedelta
from typing import Dict, Any, List, Optional
import numpy as np

def forecast_mandi_arrivals(
    centre_daily_capacity: float,
    registered_pending_quintals: float,
    forecast_days: int = 7,
    start_date: Optional[date] = None,
    weather_risks: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Produces a 7-day arrival forecast for procurement centres.
    Incorporates day-of-week multipliers and weather suppressions/surges.
    """
    if start_date is None:
        start_date = date.today()

    # Typical mandi arrival pattern by day-of-week (0=Mon, 6=Sun)
    # Mandis typically see peak arrivals mid-week, lower on Sundays
    day_weights = {
        0: 1.15,  # Monday surge
        1: 1.25,  # Tuesday peak
        2: 1.10,  # Wednesday
        3: 1.20,  # Thursday
        4: 1.05,  # Friday
        5: 0.85,  # Saturday
        6: 0.35   # Sunday reduced operations
    }

    forecast = []
    total_expected = 0.0
    carryover = 0.0

    for i in range(forecast_days):
        current_day = start_date + timedelta(days=i)
        dow = current_day.weekday()
        base_multiplier = day_weights.get(dow, 1.0)

        # Baseline expected arrival around 65-85% of daily capacity, plus pending farmer demand
        baseline_arrival = (centre_daily_capacity * 0.70) * base_multiplier
        baseline_arrival += (registered_pending_quintals / max(1, forecast_days * 2.5))

        # Check weather suppression if provided
        weather_risk = "LOW"
        if weather_risks and i < len(weather_risks):
            weather_risk = weather_risks[i]

        if weather_risk == "HIGH":
            # 60% of arrivals delayed due to bad weather
            suppressed = baseline_arrival * 0.40
            carryover += (baseline_arrival - suppressed)
            expected_quintals = suppressed
        elif weather_risk == "MEDIUM":
            expected_quintals = baseline_arrival * 0.85
            carryover += (baseline_arrival * 0.15)
        else:
            # Clear day absorbs portion of carryover
            expected_quintals = baseline_arrival + (carryover * 0.60)
            carryover *= 0.40

        # Estimate average truck/trolley load ~ 35 quintals
        vehicles = int(np.ceil(expected_quintals / 35.0))
        utilization_pct = min(120.0, round((expected_quintals / centre_daily_capacity) * 100.0, 1))

        # Congestion indicator
        if utilization_pct >= 95.0:
            congestion = "HIGH_CONGESTION"
        elif utilization_pct >= 75.0:
            congestion = "MODERATE"
        else:
            congestion = "NORMAL"

        expected_val = round(float(expected_quintals), 1)
        total_expected += expected_val

        forecast.append({
            "date": current_day.isoformat(),
            "day_name": current_day.strftime("%A"),
            "expected_quintals": expected_val,
            "estimated_vehicles": vehicles,
            "capacity_quintals": centre_daily_capacity,
            "utilization_pct": utilization_pct,
            "congestion_level": congestion,
            "weather_risk": weather_risk
        })

    return {
        "start_date": start_date.isoformat(),
        "forecast_days": forecast_days,
        "total_expected_quintals": round(total_expected, 1),
        "daily_forecasts": forecast
    }
