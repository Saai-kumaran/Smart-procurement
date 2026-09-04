"""Optimization controller wrapping multi-objective scheduling."""
from backend.algorithms.slot_optimizer import optimize_procurement_slots

class OptimizationController:
    @staticmethod
    def optimize_slots(**kwargs):
        return optimize_procurement_slots(**kwargs)

optimization_controller = OptimizationController()
