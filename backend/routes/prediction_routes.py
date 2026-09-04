"""Crop Prediction, Satellite NDVI, and Demand Forecasting Endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session

from backend.models import get_db, Crop, ProcurementCentre
from backend.algorithms.crop_maturity import estimate_crop_maturity
from backend.algorithms.demand_forecasting import forecast_mandi_arrivals
from backend.integrations.copernicus_service import copernicus_service
from backend.integrations.weather_service import weather_service
from backend.services.centre_service import centre_service

router = APIRouter(prefix="/api/predictions", tags=["Predictions & Intelligence"])

@router.get("/satellite-ndvi")
async def get_satellite_ndvi(
    latitude: float = Query(..., description="Latitude of the farm field"),
    longitude: float = Query(..., description="Longitude of the farm field")
):
    """Fetches Sentinel-2 L2A satellite bands and calculates NDVI vegetation index."""
    return await copernicus_service.fetch_farm_ndvi(latitude, longitude)

@router.get("/crop-maturity/{crop_id}")
async def get_crop_maturity(crop_id: str, db: Session = Depends(get_db)):
    """Computes multi-factor crop maturity and harvest readiness for a registered crop."""
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    farm = crop.farm
    sat_data = await copernicus_service.fetch_farm_ndvi(farm.latitude, farm.longitude)
    ndvi = sat_data.get("ndvi_value", 0.75)

    maturity = estimate_crop_maturity(
        crop_name=crop.crop_name,
        sowing_date=crop.sowing_date,
        expected_harvest_date=crop.expected_harvest_date,
        current_ndvi=ndvi
    )

    return {
        "crop_id": crop.id,
        "crop_name": crop.crop_name,
        "variety": crop.variety,
        "farm_coordinates": {"lat": farm.latitude, "lon": farm.longitude},
        "satellite_ndvi": sat_data,
        "maturity": maturity
    }

@router.get("/demand-forecast/{centre_id}")
async def get_centre_demand_forecast(centre_id: str, db: Session = Depends(get_db)):
    """Generates 7-day arrival volume projection for the procurement centre."""
    centre = centre_service.get_centre_by_id(db, centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    forecast_weather = await weather_service.get_7day_forecast(centre.latitude, centre.longitude)
    risks = [f["risk_level"] for f in forecast_weather]

    result = forecast_mandi_arrivals(
        centre_daily_capacity=centre.daily_capacity_quintals,
        registered_pending_quintals=1200.0,
        forecast_days=7,
        weather_risks=risks
    )
    result["centre_name"] = centre.centre_name
    result["centre_code"] = centre.centre_code
    return result

@router.get("/weather-forecast")
async def get_weather(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude")
):
    """Provides 7-day weather forecast and harvest risk levels for coordinates."""
    current = await weather_service.get_current_weather(latitude, longitude)
    forecast_7d = await weather_service.get_7day_forecast(latitude, longitude)
    return {
        "current": current,
        "forecast_7day": forecast_7d
    }
