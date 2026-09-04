"""Farmer controller handling profile and registration flows."""
from sqlalchemy.orm import Session
from backend.services.farmer_service import farmer_service

class FarmerController:
    @staticmethod
    def get_profile(db: Session, farmer_id: str):
        return farmer_service.get_farmer_by_id(db, farmer_id)

    @staticmethod
    def list_crops(db: Session, farmer_id: str):
        return farmer_service.list_farmer_crops(db, farmer_id)

farmer_controller = FarmerController()
