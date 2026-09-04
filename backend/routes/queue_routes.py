"""Queue Management Endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models import get_db
from backend.services.queue_service import queue_service

router = APIRouter(prefix="/api/queue", tags=["Queue"])

@router.get("/centre/{centre_id}")
def get_centre_queue(centre_id: str, db: Session = Depends(get_db)):
    return queue_service.get_centre_queue(db, centre_id)

@router.get("/booking/{booking_id}")
def get_booking_queue_status(booking_id: str, db: Session = Depends(get_db)):
    return queue_service.get_farmer_queue_position(db, booking_id)
