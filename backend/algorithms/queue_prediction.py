"""
Queue Waiting Time and Turnaround Prediction Algorithm.
Estimates the waiting duration for farmers based on queue position,
weighbridge operational speed, and inspection throughput.
"""
from typing import Dict, Any

def predict_queue_waiting_time(
    queue_position: int,
    vehicles_ahead: int,
    hourly_processing_capacity: float = 150.0,
    avg_quintals_per_vehicle: float = 35.0,
    current_stage: str = "WAITING"
) -> Dict[str, Any]:
    """
    Computes expected waiting time in minutes.
    - Inspection throughput: ~ 6-8 minutes per lot.
    - Weighbridge throughput: ~ 5-7 minutes per vehicle.
    - Unloading & bag stacking: ~ 12-15 minutes.
    """
    if queue_position <= 0:
        return {
            "estimated_wait_minutes": 0,
            "queue_position": 0,
            "status": "IMMEDIATE_PROCESSING",
            "message": "You are next for entry/processing."
        }

    # Time per vehicle through the complete pipeline (minutes)
    # Mandi processing rate: (vehicles per hour) = hourly_capacity / avg_quintals
    vehicles_per_hour = max(4.0, hourly_processing_capacity / avg_quintals_per_vehicle)
    minutes_per_vehicle = 60.0 / vehicles_per_hour

    # Stage-based remaining duration
    stage_adjustment = {
        "WAITING": 0.0,
        "ARRIVED": -5.0,
        "CHECKED_IN": -10.0,
        "INSPECTION": -20.0,
        "WEIGHING": -30.0,
        "PROCUREMENT_COMPLETED": 0.0
    }

    base_wait = vehicles_ahead * minutes_per_vehicle
    adjusted_wait = max(5.0, base_wait + stage_adjustment.get(current_stage, 0.0))
    wait_min = int(round(adjusted_wait))

    return {
        "estimated_wait_minutes": wait_min,
        "queue_position": queue_position,
        "vehicles_ahead": vehicles_ahead,
        "turnaround_rate_vehicles_per_hour": round(vehicles_per_hour, 1),
        "message": f"Estimated wait: ~{wait_min} mins ({vehicles_ahead} vehicles ahead)."
    }
