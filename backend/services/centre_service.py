"""Procurement Centre management business service."""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from backend.models import ProcurementCentre, Slot, Booking
import uuid

class CentreService:
    def list_active_centres(self, db: Session, district: Optional[str] = None) -> List[ProcurementCentre]:
        query = db.query(ProcurementCentre).filter(ProcurementCentre.is_active == True)
        if district:
            query = query.filter(ProcurementCentre.district.ilike(f"%{district}%"))
        return query.all()

    def get_centre_by_id(self, db: Session, centre_id: str) -> Optional[ProcurementCentre]:
        return db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()

    def get_or_generate_slots_for_centre(self, db: Session, centre_id: str, days_ahead: int = 7) -> List[Slot]:
        """Ensures procurement slots exist for the given centre over the upcoming days."""
        centre = self.get_centre_by_id(db, centre_id)
        if not centre:
            return []

        today = date.today()
        time_windows = [
            ("08:00", "10:00"),
            ("10:00", "12:00"),
            ("13:00", "15:00"),
            ("15:00", "17:00")
        ]

        slot_capacity = round(centre.daily_capacity_quintals / len(time_windows), 1)

        for i in range(days_ahead):
            slot_date = today + timedelta(days=i)
            for start, end in time_windows:
                existing = db.query(Slot).filter(
                    Slot.centre_id == centre_id,
                    Slot.slot_date == slot_date,
                    Slot.start_time == start
                ).first()
                if not existing:
                    new_slot = Slot(
                        id=f"slot-{centre.centre_code.lower()}-{slot_date.strftime('%Y%m%d')}-{start.replace(':', '')}",
                        centre_id=centre_id,
                        slot_date=slot_date,
                        start_time=start,
                        end_time=end,
                        max_capacity_quintals=slot_capacity,
                        reserved_capacity_quintals=0.0,
                        max_vehicles=20,
                        booked_vehicles=0,
                        status="OPEN"
                    )
                    db.add(new_slot)
        db.commit()

        return db.query(Slot).filter(
            Slot.centre_id == centre_id,
            Slot.slot_date >= today
        ).order_by(Slot.slot_date, Slot.start_time).all()

centre_service = CentreService()
