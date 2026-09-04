"""Unit tests for Geofencing calculations."""
from backend.integrations.map_service import map_service
from backend.algorithms.harvest_risk import calculate_weather_risk

def test_haversine_distance():
    # Distance between Karnal Main Mandi (29.6857, 76.9905) and Taraori Mandi (29.8000, 76.9300)
    dist = map_service.haversine_distance_km(29.6857, 76.9905, 29.8000, 76.9300)
    assert 13.0 <= dist <= 16.0

def test_weather_risk_heavy_rain():
    risk = calculate_weather_risk(temperature=28.0, rainfall_mm=32.0, humidity_pct=88.0)
    assert risk["risk_level"] == "HIGH"
    assert risk["risk_score"] >= 0.55

def test_weather_risk_clear_sky():
    risk = calculate_weather_risk(temperature=31.0, rainfall_mm=0.0, humidity_pct=55.0)
    assert risk["risk_level"] == "LOW"
    assert risk["risk_score"] < 0.25
