"""Farmer, Farm, and Crop management business service."""
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import date
from backend.models import User, Farmer, Farm, Crop
from backend.integrations.enam_service import enam_service
import uuid

class FarmerService:
    def get_farmer_by_user_id(self, db: Session, user_id: str) -> Optional[Farmer]:
        return db.query(Farmer).filter(Farmer.user_id == user_id).first()

    def get_farmer_by_id(self, db: Session, farmer_id: str) -> Optional[Farmer]:
        return db.query(Farmer).filter(Farmer.id == farmer_id).first()

    def register_farm(
        self,
        db: Session,
        farmer_id: str,
        survey_number: str,
        area_acres: float,
        latitude: float,
        longitude: float,
        soil_type: str = "Loam",
        irrigation_source: str = "Tube Well"
    ) -> Farm:
        farm = Farm(
            id=f"farm-{uuid.uuid4().hex[:8]}",
            farmer_id=farmer_id,
            survey_number=survey_number,
            area_acres=area_acres,
            latitude=latitude,
            longitude=longitude,
            soil_type=soil_type,
            irrigation_source=irrigation_source
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
        return farm

    def register_crop(
        self,
        db: Session,
        farm_id: str,
        crop_name: str,
        variety: str,
        sowing_date: date,
        expected_harvest_date: date,
        estimated_quantity_quintals: float
    ) -> Crop:
        msp = enam_service.get_msp_rate(crop_name)
        crop = Crop(
            id=f"crop-{uuid.uuid4().hex[:8]}",
            farm_id=farm_id,
            crop_name=crop_name,
            variety=variety,
            sowing_date=sowing_date,
            expected_harvest_date=expected_harvest_date,
            estimated_quantity_quintals=estimated_quantity_quintals,
            msp_rate_per_quintal=msp,
            status="REGISTERED"
        )
        db.add(crop)
        db.commit()
        db.refresh(crop)
        return crop

    def list_farmer_crops(self, db: Session, farmer_id: str) -> List[Crop]:
        farms = db.query(Farm).filter(Farm.farmer_id == farmer_id).all()
        farm_ids = [f.id for f in farms]
        return db.query(Crop).filter(Crop.farm_id.in_(farm_ids)).all()

farmer_service = FarmerService()
