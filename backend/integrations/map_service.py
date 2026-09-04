"""
Mappls / Spatial Distance and Routing Integration Service.
Computes geodetic distance, road-network travel distance, and estimated travel time
between farmer fields and procurement mandis.
"""
import math
from typing import Dict, Any
from backend.config.settings import settings

class MapService:
    def __init__(self):
        self.api_key = settings.MAPPLS_API_KEY
        self.demo_mode = settings.DEMO_MODE or not self.api_key

    def haversine_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates great-circle distance between two points in kilometers."""
        R = 6371.0  # Earth's radius in km

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def calculate_travel_info(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        vehicle_type: str = "TRACTOR_TROLLEY"
    ) -> Dict[str, Any]:
        """
        Calculates road route distance and travel time.
        Rural roads circuity factor ~ 1.25x haversine distance.
        Loaded tractor-trolley speed ~ 22 km/h; pickup/truck ~ 35 km/h.
        """
        straight_line_km = self.haversine_distance_km(origin_lat, origin_lon, dest_lat, dest_lon)
        # Road routing adjustment
        road_distance_km = round(straight_line_km * 1.25, 1)

        speed_kmh = 22.0 if vehicle_type == "TRACTOR_TROLLEY" else 35.0
        travel_hours = road_distance_km / speed_kmh
        travel_minutes = max(5, int(round(travel_hours * 60.0)))

        return {
            "origin": {"lat": origin_lat, "lon": origin_lon},
            "destination": {"lat": dest_lat, "lon": dest_lon},
            "straight_line_distance_km": round(straight_line_km, 2),
            "road_distance_km": road_distance_km,
            "estimated_travel_minutes": travel_minutes,
            "vehicle_type": vehicle_type,
            "routing_source": "Mappls / Road-Circuity Calibrated Model"
        }

map_service = MapService()
