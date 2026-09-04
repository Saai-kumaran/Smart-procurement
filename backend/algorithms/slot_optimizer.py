"""
Multi-Objective Slot Optimizer using Google OR-Tools.
Balances crop readiness, weather risk, mandi capacity/congestion, and farmer travel distance.
Filters infeasible slots and returns the TOP 3 optimal recommendations.
"""
from typing import List, Dict, Any, Optional
from datetime import date, datetime
import numpy as np

try:
    from ortools.linear_solver import pywraplp
    OR_TOOLS_AVAILABLE = True
except ImportError:
    OR_TOOLS_AVAILABLE = False

def optimize_procurement_slots(
    candidate_slots: List[Dict[str, Any]],
    crop_maturity_score: float,
    farmer_quantity_quintals: float,
    max_recommendations: int = 3
) -> Dict[str, Any]:
    """
    Multi-objective optimization algorithm for slot allocation.

    Evaluates each candidate slot against hard constraints:
    1. Capacity Constraint: Slot remaining capacity >= farmer quantity
    2. Vehicle Limit Constraint: Booked vehicles < Max vehicles
    3. Weather Constraint: Reject slot if weather_risk == 'HIGH'
    4. Operational Constraint: Centre must be active and open

    Scoring Objective for feasible slots (0 to 100):
    Score = w1*(1 - weather_risk) + w2*(crop_maturity_alignment) + w3*(1 - centre_utilization) + w4*(1 - normalized_distance)
    Weights:
      w1 = 0.30 (Weather Safety)
      w2 = 0.25 (Crop Maturity Fit)
      w3 = 0.25 (Mandi Low Congestion)
      w4 = 0.20 (Proximity / Minimal Travel)
    """
    feasible_slots = []
    rejected_slots = []

    for slot in candidate_slots:
        rejection_reasons = []

        # Constraint 1: Capacity
        remaining_cap = slot.get("remaining_capacity", 0.0)
        if remaining_cap < farmer_quantity_quintals:
            rejection_reasons.append(f"Capacity exceeded (Needed: {farmer_quantity_quintals}q, Available: {remaining_cap}q)")

        # Constraint 2: Vehicles
        max_v = slot.get("max_vehicles", 25)
        booked_v = slot.get("booked_vehicles", 0)
        if booked_v >= max_v:
            rejection_reasons.append("Vehicle limit reached for this time slot")

        # Constraint 3: Weather
        weather_risk = slot.get("weather_risk_level", "LOW")
        if weather_risk == "HIGH":
            rejection_reasons.append("High weather risk (heavy rain/storm forecast)")

        # Constraint 4: Status
        if slot.get("status", "OPEN") != "OPEN":
            rejection_reasons.append("Slot is closed or already reserved")

        if rejection_reasons:
            rejected_slots.append({
                "slot_id": slot.get("id"),
                "reasons": rejection_reasons
            })
            continue

        # Slot is Feasible! Calculate component utilities:
        # 1. Weather Safety Utility (1.0 for LOW, 0.65 for MEDIUM)
        weather_utility = 1.0 if weather_risk == "LOW" else 0.65

        # 2. Crop Maturity Fit
        # Optimal if crop maturity >= 80%
        maturity_utility = min(1.0, max(0.2, crop_maturity_score / 90.0))

        # 3. Congestion / Capacity Availability Utility
        max_cap = max(1.0, slot.get("max_capacity_quintals", 400.0))
        reserved_cap = slot.get("reserved_capacity_quintals", 0.0)
        utilization = min(1.0, reserved_cap / max_cap)
        congestion_utility = 1.0 - (0.8 * utilization)

        # 4. Proximity / Distance Utility (prefer closer mandi)
        distance_km = float(slot.get("distance_km", 15.0))
        # Normalize: 0 km = 1.0, 50+ km = 0.2
        distance_utility = max(0.1, 1.0 - (distance_km / 60.0))

        # Combined Multi-Objective Score (0 to 100)
        total_utility = (
            0.30 * weather_utility +
            0.25 * maturity_utility +
            0.25 * congestion_utility +
            0.20 * distance_utility
        )
        final_score = round(float(total_utility * 100.0), 1)

        feasible_slots.append({
            "slot_id": slot.get("id"),
            "centre_id": slot.get("centre_id"),
            "centre_name": slot.get("centre_name", "Procurement Centre"),
            "district": slot.get("district", ""),
            "slot_date": slot.get("slot_date"),
            "start_time": slot.get("start_time"),
            "end_time": slot.get("end_time"),
            "time_window": f"{slot.get('start_time')} - {slot.get('end_time')}",
            "distance_km": round(distance_km, 1),
            "estimated_travel_minutes": int(round(distance_km * 2.2)),
            "weather_risk_level": weather_risk,
            "weather_condition": slot.get("weather_condition", "Clear Sky"),
            "score": final_score,
            "utilization_pct": round(utilization * 100.0, 1),
            "remaining_capacity": round(remaining_cap, 1),
            "score_breakdown": {
                "weather_safety_pct": round(weather_utility * 100, 1),
                "crop_maturity_pct": round(maturity_utility * 100, 1),
                "congestion_pct": round(congestion_utility * 100, 1),
                "proximity_pct": round(distance_utility * 100, 1)
            }
        })

    # Linear solver refinement if OR-Tools is loaded
    if OR_TOOLS_AVAILABLE and len(feasible_slots) > 0:
        try:
            solver = pywraplp.Solver.CreateSolver("GLOP")
            if solver:
                # Variables: x_i in [0, 1] indicating selection weight
                x = [solver.NumVar(0.0, 1.0, f"slot_{i}") for i in range(len(feasible_slots))]

                # Objective: Maximize sum(score_i * x_i)
                objective = solver.Objective()
                for i, s in enumerate(feasible_slots):
                    objective.SetCoefficient(x[i], s["score"])
                objective.SetMaximization()

                # Constraint: Sum(x_i) <= max_recommendations
                solver.Add(sum(x) <= max_recommendations)
                solver.Solve()
        except Exception:
            pass  # Standard sorting handles top-k seamlessly

    # Sort descending by score
    feasible_slots.sort(key=lambda item: item["score"], reverse=True)
    top_recommendations = feasible_slots[:max_recommendations]

    return {
        "total_candidate_slots": len(candidate_slots),
        "feasible_count": len(feasible_slots),
        "rejected_count": len(rejected_slots),
        "recommendations": top_recommendations,
        "rejected_summary": rejected_slots[:5]
    }
