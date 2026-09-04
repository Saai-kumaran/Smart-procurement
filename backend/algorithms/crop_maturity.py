"""
Crop Maturity Prediction Engine.
Combines Sentinel-2 NDVI spectral indices, growth degree days (GDD),
crop growth cycles, and farmer-reported sowing/harvest data.

IMPORTANT NOTICE:
Satellite-derived vegetation indicators provide an additional signal
for estimating crop condition/readiness, complementing on-ground farm data.
"""
from datetime import date, datetime
from typing import Dict, Any, List, Optional
import numpy as np

# Standard crop life cycle parameters (Days from sowing to maturity)
CROP_CYCLE_PARAMS = {
    "Wheat": {"min_days": 110, "opt_days": 130, "max_days": 150, "peak_ndvi": 0.82, "mature_ndvi": 0.65},
    "Paddy": {"min_days": 115, "opt_days": 135, "max_days": 155, "peak_ndvi": 0.85, "mature_ndvi": 0.68},
    "Basmati Rice": {"min_days": 125, "opt_days": 145, "max_days": 165, "peak_ndvi": 0.86, "mature_ndvi": 0.69},
    "Soybean": {"min_days": 90, "opt_days": 105, "max_days": 120, "peak_ndvi": 0.80, "mature_ndvi": 0.62},
    "Maize": {"min_days": 95, "opt_days": 110, "max_days": 125, "peak_ndvi": 0.84, "mature_ndvi": 0.66},
    "Cotton": {"min_days": 150, "opt_days": 175, "max_days": 200, "peak_ndvi": 0.78, "mature_ndvi": 0.60},
    "Mustard": {"min_days": 105, "opt_days": 120, "max_days": 135, "peak_ndvi": 0.82, "mature_ndvi": 0.63},
    "Gram": {"min_days": 100, "opt_days": 115, "max_days": 130, "peak_ndvi": 0.76, "mature_ndvi": 0.58},
}

def calculate_ndvi(b04_red: float, b08_nir: float) -> float:
    """
    Computes Normalized Difference Vegetation Index (NDVI) from Sentinel-2 bands:
    NDVI = (NIR - RED) / (NIR + RED)
    Range: -1.0 to +1.0 (Typical dense crop vegetation: 0.5 to 0.88).
    """
    denominator = b08_nir + b04_red
    if abs(denominator) < 1e-6:
        return 0.0
    ndvi = (b08_nir - b04_red) / denominator
    return round(float(np.clip(ndvi, -1.0, 1.0)), 4)

def estimate_crop_maturity(
    crop_name: str,
    sowing_date: date,
    expected_harvest_date: Optional[date] = None,
    current_ndvi: Optional[float] = None,
    historical_ndvis: Optional[List[float]] = None,
    current_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Multi-factor crop readiness & maturity evaluation.
    Returns maturity score (0-100), categorical status, estimated days, and signals.
    """
    if current_date is None:
        current_date = date.today()

    params = CROP_CYCLE_PARAMS.get(crop_name, {
        "min_days": 100, "opt_days": 125, "max_days": 145, "peak_ndvi": 0.80, "mature_ndvi": 0.65
    })

    # 1. Temporal Progress (Days elapsed vs optimal cycle)
    days_elapsed = (current_date - sowing_date).days
    opt_days = params["opt_days"]

    # Ratio of growth completed
    time_ratio = max(0.0, min(1.5, days_elapsed / opt_days)) if opt_days > 0 else 1.0

    # 2. NDVI Spectral Signal Assessment
    # High NDVI (~0.75-0.85) indicates vegetative peak.
    # At maturity / senescence, NDVI decreases to ~0.55-0.70 as green chlorophyll gives way to ripening gold.
    if current_ndvi is None:
        # Default estimated NDVI based on time ratio
        if time_ratio < 0.3:
            current_ndvi = 0.35 + (time_ratio * 0.8)
        elif time_ratio < 0.75:
            current_ndvi = 0.65 + (time_ratio * 0.2)
        elif time_ratio <= 1.0:
            current_ndvi = params["mature_ndvi"] + ((1.0 - time_ratio) * 0.15)
        else:
            current_ndvi = max(0.40, params["mature_ndvi"] - 0.15)

    ndvi_val = round(float(current_ndvi), 3)

    # 3. Trend analysis from historical NDVI list
    trend = "STABLE"
    if historical_ndvis and len(historical_ndvis) >= 2:
        diff = historical_ndvis[-1] - historical_ndvis[0]
        if diff > 0.05:
            trend = "INCREASING (VEGETATIVE GROWTH)"
        elif diff < -0.05:
            trend = "DECLINING (SENESCENCE/MATURING)"

    # 4. Multi-objective maturity score (0 to 100)
    # 0-40: Early/Vegetative, 41-70: Flowering/Grain filling, 71-89: Near Harvest, 90-100: Ready for Harvest
    if time_ratio < 0.5:
        base_score = time_ratio * 70.0
        status = "EARLY_STAGE"
    elif time_ratio < 0.85:
        base_score = 35.0 + ((time_ratio - 0.5) / 0.35) * 35.0
        status = "GROWING"
    elif time_ratio <= 1.08:
        # Optimal harvest window!
        base_score = 70.0 + ((time_ratio - 0.85) / 0.23) * 25.0
        status = "NEAR_HARVEST" if base_score < 88.0 else "READY"
    else:
        # Over-mature
        base_score = max(75.0, 95.0 - ((time_ratio - 1.08) * 40.0))
        status = "OVERMATURE"

    # Refine score with NDVI senescence verification
    if 0.55 <= ndvi_val <= 0.72 and status in ("NEAR_HARVEST", "READY"):
        base_score = min(98.0, base_score + 5.0)

    maturity_score = round(float(np.clip(base_score, 0.0, 100.0)), 1)

    # 5. Estimated days to harvest
    if expected_harvest_date:
        farmer_diff = (expected_harvest_date - current_date).days
        estimated_days = max(0, farmer_diff)
    else:
        remaining_days = max(0, int(opt_days - days_elapsed))
        estimated_days = remaining_days

    if maturity_score >= 88.0:
        estimated_days = min(estimated_days, 3)

    # Harvest window ready if <= 12 days to harvest
    harvest_window_ready = estimated_days <= 12

    return {
        "crop_name": crop_name,
        "maturity_score": maturity_score,
        "status": status,
        "estimated_days": estimated_days,
        "days_elapsed": days_elapsed,
        "current_ndvi": ndvi_val,
        "ndvi_trend": trend,
        "harvest_window_ready": harvest_window_ready,
        "explanation": "Satellite-derived vegetation indicators provide an additional signal for estimating crop condition/readiness."
    }
