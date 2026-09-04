"""
Intelligent Scheduling and Slot Recommendation Service.
Synthesizes satellite NDVI indicators, weather forecast risks, mandi travel distance,
and real-time capacity to produce optimal TOP 3 slot recommendations.
"""
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Dict, Any, List, Optional

from backend.models import Farmer, Farm, Crop, ProcurementCentre, Slot
from backend.services.centre_service import centre_service
from backend.algorithms.crop_maturity import estimate_crop_maturity
from backend.algorithms.slot_optimizer import optimize_procurement_slots
from backend.integrations.copernicus_service import copernicus_service
from backend.integrations.weather_service import weather_service
from backend.integrations.map_service import map_service

class SchedulingService:
    async def recommend_slots_for_farmer(
        self,
        db: Session,
        farmer_id: str,
        crop_id: str,
        preferred_centre_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the end-to-end intelligent scheduling pipeline:
        1. Fetch farm and crop details
        2. Fetch satellite NDVI signal via Copernicus
        3. Evaluate crop maturity score
        4. Query active procurement centres in district / nearby
        5. Evaluate 7-day weather risk forecast for each mandi zone
        6. Compute road travel distance and time
        7. Run Multi-Objective Slot Optimizer
        8. Return TOP 3 optimal slots
        """
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        crop = db.query(Crop).filter(Crop.id == crop_id).first()
        if not crop or not crop.farm:
            raise ValueError("Crop or associated farm record not found.")

        farm = crop.farm
        farm_lat = farm.latitude
        farm_lon = farm.longitude

        # 1. Satellite Observation & Maturity
        satellite_data = await copernicus_service.fetch_farm_ndvi(farm_lat, farm_lon)
        ndvi_val = satellite_data.get("ndvi_value", 0.75)

        maturity_eval = estimate_crop_maturity(
            crop_name=crop.crop_name,
            sowing_date=crop.sowing_date,
            expected_harvest_date=crop.expected_harvest_date,
            current_ndvi=ndvi_val
        )

        # 2. Identify candidate procurement centres
        centres = []
        if preferred_centre_id:
            c = centre_service.get_centre_by_id(db, preferred_centre_id)
            if c:
                centres.append(c)
        if not centres:
            centres = centre_service.list_active_centres(db, district=farmer.district if farmer else None)
        if not centres:
            centres = centre_service.list_active_centres(db)  # Fallback to all active

        # 3. Assemble candidate slots across nearby centres for next 7 days
        candidate_slots = []
        today = date.today()

        for centre in centres:
            # Ensure slots exist in DB
            slots = centre_service.get_or_generate_slots_for_centre(db, centre.id, days_ahead=7)

            # Weather forecast for centre coordinates
            forecast = await weather_service.get_7day_forecast(centre.latitude, centre.longitude)
            weather_by_date = {f["date"]: f for f in forecast}

            # Travel distance from farm to centre
            travel = map_service.calculate_travel_info(farm_lat, farm_lon, centre.latitude, centre.longitude)

            for slot in slots:
                if slot.slot_date < today:
                    continue

                slot_date_str = slot.slot_date.isoformat()
                w_info = weather_by_date.get(slot_date_str, {"risk_level": "LOW", "condition": "Clear Sky"})

                candidate_slots.append({
                    "id": slot.id,
                    "centre_id": centre.id,
                    "centre_name": centre.centre_name,
                    "district": centre.district,
                    "slot_date": slot_date_str,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "max_capacity_quintals": slot.max_capacity_quintals,
                    "reserved_capacity_quintals": slot.reserved_capacity_quintals,
                    "remaining_capacity": slot.remaining_capacity,
                    "max_vehicles": slot.max_vehicles,
                    "booked_vehicles": slot.booked_vehicles,
                    "status": slot.status,
                    "distance_km": travel["road_distance_km"],
                    "weather_risk_level": w_info.get("risk_level", "LOW"),
                    "weather_condition": w_info.get("condition", "Clear Sky")
                })

        # 4. Run Multi-Objective Slot Optimizer
        optimization_result = optimize_procurement_slots(
            candidate_slots=candidate_slots,
            crop_maturity_score=maturity_eval["maturity_score"],
            farmer_quantity_quintals=crop.estimated_quantity_quintals,
            max_recommendations=3
        )

        return {
            "farmer_id": farmer_id,
            "crop_id": crop_id,
            "crop_name": crop.crop_name,
            "estimated_quantity_quintals": crop.estimated_quantity_quintals,
            "crop_maturity": maturity_eval,
            "satellite_ndvi": satellite_data,
            "recommendations": optimization_result["recommendations"],
            "total_slots_evaluated": optimization_result["total_candidate_slots"],
            "feasible_slots_found": optimization_result["feasible_count"]
        }

scheduling_service = SchedulingService()
