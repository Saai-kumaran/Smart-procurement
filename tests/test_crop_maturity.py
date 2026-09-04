"""Unit tests for Sentinel-2 NDVI calculation and crop maturity evaluation."""
from datetime import date
from backend.algorithms.crop_maturity import calculate_ndvi, estimate_crop_maturity

def test_calculate_ndvi():
    # Dense green vegetation (High NIR, Low Red)
    ndvi = calculate_ndvi(b04_red=0.08, b08_nir=0.72)
    assert 0.75 <= ndvi <= 0.85

    # Water or bare soil
    ndvi_soil = calculate_ndvi(b04_red=0.20, b08_nir=0.25)
    assert 0.05 <= ndvi_soil <= 0.15

def test_crop_maturity_near_harvest():
    # Sowing date 120 days ago for Wheat (optimal cycle ~ 130 days)
    sowing = date(2026, 5, 10)
    current = date(2026, 9, 4)
    expected_harvest = date(2026, 9, 9)

    result = estimate_crop_maturity(
        crop_name="Wheat",
        sowing_date=sowing,
        expected_harvest_date=expected_harvest,
        current_ndvi=0.68,
        current_date=current
    )

    assert result["maturity_score"] >= 75.0
    assert result["status"] in ["NEAR_HARVEST", "READY"]
    assert result["harvest_window_ready"] is True
    assert "Satellite-derived vegetation indicators" in result["explanation"]
