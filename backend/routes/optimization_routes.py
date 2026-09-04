"""Optimization test and simulation endpoint."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.algorithms.slot_optimizer import optimize_procurement_slots

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])

class OptimizationTestRequest(BaseModel):
    crop_maturity_score: float = 85.0
    farmer_quantity_quintals: float = 50.0
    candidate_slots: List[Dict[str, Any]]

@router.post("/run")
def run_optimization(req: OptimizationTestRequest):
    """Directly invokes the multi-objective OR-Tools slot optimizer."""
    return optimize_procurement_slots(
        candidate_slots=req.candidate_slots,
        crop_maturity_score=req.crop_maturity_score,
        farmer_quantity_quintals=req.farmer_quantity_quintals
    )
