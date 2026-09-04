"""Unit tests for Multi-Objective Slot Optimizer."""
from backend.algorithms.slot_optimizer import optimize_procurement_slots

def test_slot_optimizer_filtering_and_top_recommendations():
    candidate_slots = [
        {
            "id": "slot-1",
            "centre_id": "cnt-01",
            "centre_name": "Karnal Mandi",
            "slot_date": "2026-09-06",
            "start_time": "08:00",
            "end_time": "10:00",
            "max_capacity_quintals": 400.0,
            "reserved_capacity_quintals": 50.0,
            "remaining_capacity": 350.0,
            "max_vehicles": 20,
            "booked_vehicles": 2,
            "status": "OPEN",
            "distance_km": 6.5,
            "weather_risk_level": "LOW"
        },
        {
            "id": "slot-2-rainy",
            "centre_id": "cnt-01",
            "centre_name": "Karnal Mandi",
            "slot_date": "2026-09-07",
            "start_time": "10:00",
            "end_time": "12:00",
            "max_capacity_quintals": 400.0,
            "reserved_capacity_quintals": 10.0,
            "remaining_capacity": 390.0,
            "max_vehicles": 20,
            "booked_vehicles": 1,
            "status": "OPEN",
            "distance_km": 6.5,
            "weather_risk_level": "HIGH"  # Should be rejected due to heavy rain constraint
        },
        {
            "id": "slot-3-full",
            "centre_id": "cnt-02",
            "centre_name": "Taraori Mandi",
            "slot_date": "2026-09-06",
            "start_time": "08:00",
            "end_time": "10:00",
            "max_capacity_quintals": 200.0,
            "reserved_capacity_quintals": 195.0,
            "remaining_capacity": 5.0,  # Insufficient for 50 quintals
            "max_vehicles": 15,
            "booked_vehicles": 15,
            "status": "FULL",
            "distance_km": 12.0,
            "weather_risk_level": "LOW"
        },
        {
            "id": "slot-4-far",
            "centre_id": "cnt-03",
            "centre_name": "Khanna Mandi",
            "slot_date": "2026-09-06",
            "start_time": "13:00",
            "end_time": "15:00",
            "max_capacity_quintals": 500.0,
            "reserved_capacity_quintals": 40.0,
            "remaining_capacity": 460.0,
            "max_vehicles": 25,
            "booked_vehicles": 2,
            "status": "OPEN",
            "distance_km": 35.0,
            "weather_risk_level": "LOW"
        }
    ]

    res = optimize_procurement_slots(
        candidate_slots=candidate_slots,
        crop_maturity_score=88.0,
        farmer_quantity_quintals=50.0,
        max_recommendations=3
    )

    assert res["total_candidate_slots"] == 4
    # slot-2 (high rain) and slot-3 (capacity full) should be rejected
    assert res["rejected_count"] == 2
    assert res["feasible_count"] == 2

    # Top recommendation should be slot-1 (close distance and low weather risk)
    recs = res["recommendations"]
    assert len(recs) == 2
    assert recs[0]["slot_id"] == "slot-1"
    assert recs[0]["score"] > recs[1]["score"]
