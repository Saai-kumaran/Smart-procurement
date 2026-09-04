"""Prediction controller for NDVI and demand forecasting."""
from backend.algorithms.crop_maturity import estimate_crop_maturity
from backend.algorithms.demand_forecasting import forecast_mandi_arrivals

class PredictionController:
    @staticmethod
    def evaluate_maturity(**kwargs):
        return estimate_crop_maturity(**kwargs)

    @staticmethod
    def forecast_arrivals(**kwargs):
        return forecast_mandi_arrivals(**kwargs)

prediction_controller = PredictionController()
