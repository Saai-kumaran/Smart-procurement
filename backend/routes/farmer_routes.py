"""Farmer and Farm Management Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session

from backend.models import get_db, Farmer, Farm, Crop
from backend.services.farmer_service import farmer_service

router = APIRouter(prefix="/api/farmer", tags=["Farmer"])

class FarmCreateRequest(BaseModel):
    farmer_id: str
    survey_number: str
    area_acres: float
    latitude: float
    longitude: float
    soil_type: Optional[str] = "Alluvial Loam"
    irrigation_source: Optional[str] = "Tube Well"

class CropCreateRequest(BaseModel):
    farm_id: str
    crop_name: str
    variety: Optional[str] = "Standard"
    sowing_date: date
    expected_harvest_date: date
    estimated_quantity_quintals: float

@router.get("/profile/{farmer_id}")
def get_farmer_profile(farmer_id: str, db: Session = Depends(get_db)):
    farmer = farmer_service.get_farmer_by_id(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    return {
        "id": farmer.id,
        "name": farmer.user.full_name if farmer.user else "",
        "phone": farmer.primary_phone,
        "village": farmer.village,
        "district": farmer.district,
        "state": farmer.state,
        "language": farmer.preferred_language,
        "farms_count": len(farmer.farms)
    }

@router.get("/farms/{farmer_id}")
def list_farmer_farms(farmer_id: str, db: Session = Depends(get_db)):
    farmer = farmer_service.get_farmer_by_id(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    farms_data = []
    for f in farmer.farms:
        farms_data.append({
            "id": f.id,
            "survey_number": f.survey_number,
            "area_acres": f.area_acres,
            "latitude": f.latitude,
            "longitude": f.longitude,
            "soil_type": f.soil_type,
            "irrigation_source": f.irrigation_source,
            "crops": [
                {
                    "id": c.id,
                    "crop_name": c.crop_name,
                    "variety": c.variety,
                    "sowing_date": c.sowing_date.isoformat(),
                    "expected_harvest_date": c.expected_harvest_date.isoformat(),
                    "estimated_quantity_quintals": c.estimated_quantity_quintals,
                    "msp_rate": c.msp_rate_per_quintal,
                    "status": c.status
                }
                for c in f.crops
            ]
        })
    return farms_data

@router.post("/farms")
def create_farm(req: FarmCreateRequest, db: Session = Depends(get_db)):
    farm = farmer_service.register_farm(
        db,
        farmer_id=req.farmer_id,
        survey_number=req.survey_number,
        area_acres=req.area_acres,
        latitude=req.latitude,
        longitude=req.longitude,
        soil_type=req.soil_type or "Alluvial Loam",
        irrigation_source=req.irrigation_source or "Tube Well"
    )
    return {
        "success": True,
        "farm_id": farm.id,
        "message": "Farm plot registered successfully."
    }

@router.post("/crops")
def create_crop(req: CropCreateRequest, db: Session = Depends(get_db)):
    crop = farmer_service.register_crop(
        db,
        farm_id=req.farm_id,
        crop_name=req.crop_name,
        variety=req.variety or "Standard",
        sowing_date=req.sowing_date,
        expected_harvest_date=req.expected_harvest_date,
        estimated_quantity_quintals=req.estimated_quantity_quintals
    )
    return {
        "success": True,
        "crop_id": crop.id,
        "crop_name": crop.crop_name,
        "estimated_quantity_quintals": crop.estimated_quantity_quintals,
        "msp_rate": crop.msp_rate_per_quintal,
        "message": "Crop registered successfully."
    }
