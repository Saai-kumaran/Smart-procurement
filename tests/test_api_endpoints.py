"""Full end-to-end integration tests for all Mandi Procurement lifecycle endpoints."""
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_root_and_health():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ONLINE"

    h = client.get("/api/health")
    assert h.status_code == 200
    assert h.json()["status"] == "HEALTHY"

def test_list_centres_and_detail():
    resp = client.get("/api/centres")
    assert resp.status_code == 200
    centres = resp.json()
    assert len(centres) >= 3

    c_id = centres[0]["id"]
    detail = client.get(f"/api/centres/{c_id}")
    assert detail.status_code == 200
    assert "daily_capacity_quintals" in detail.json()

    slots = client.get(f"/api/centres/{c_id}/slots")
    assert slots.status_code == 200
    assert len(slots.json()) > 0

def test_farmer_profile_and_farms():
    resp = client.get("/api/farmer/profile/frm-01")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Ramesh Kumar"

    farms = client.get("/api/farmer/farms/frm-01")
    assert farms.status_code == 200
    assert len(farms.json()) > 0

def test_end_to_end_mandi_procurement_flow():
    # 1. Recommend slots for Ramesh Kumar (Wheat, 120q)
    rec_payload = {
        "farmer_id": "frm-01",
        "crop_id": "crop-01",
        "preferred_centre_id": "cnt-01"
    }
    rec_resp = client.post("/api/bookings/recommend-slots", json=rec_payload)
    assert rec_resp.status_code == 200
    recs = rec_resp.json()["recommendations"]
    assert len(recs) > 0

    best_slot = recs[0]
    slot_id = best_slot["slot_id"]
    centre_id = best_slot["centre_id"]

    # 2. Confirm booking
    book_payload = {
        "farmer_id": "frm-01",
        "centre_id": centre_id,
        "slot_id": slot_id,
        "crop_id": "crop-01",
        "distance_km": best_slot["distance_km"],
        "weather_risk_level": best_slot["weather_risk_level"],
        "crop_maturity_score": rec_resp.json()["crop_maturity"]["maturity_score"]
    }
    bkg_resp = client.post("/api/bookings/confirm", json=book_payload)
    assert bkg_resp.status_code == 200
    bkg_data = bkg_resp.json()
    assert bkg_data["success"] is True
    booking_id = bkg_data["booking_id"]
    assert bkg_data["status"] == "BOOKED"
    assert "QR-SIH-" in bkg_data["qr_token"]

    # 3. Simulate Geofence arrival check-in
    # Mandi coordinates: 29.6857, 76.9905
    geo_payload = {"latitude": 29.6858, "longitude": 76.9906}
    geo_resp = client.post(f"/api/bookings/{booking_id}/check-in", json=geo_payload)
    assert geo_resp.status_code == 200
    assert geo_resp.json()["inside"] is True
    assert geo_resp.json()["status"] == "CHECKED_IN"

    # 4. Officer Quality Inspection
    insp_payload = {
        "booking_id": booking_id,
        "officer_id": "usr-off-01",
        "moisture_percentage": 11.5,
        "foreign_matter_percentage": 0.4,
        "quality_grade": "GRADE_A",
        "remarks": "Excellent FAQ quality standard wheat."
    }
    insp_resp = client.post("/api/inspections", json=insp_payload)
    assert insp_resp.status_code == 200
    assert insp_resp.json()["quality_grade"] == "GRADE_A"
    assert insp_resp.json()["next_stage"] == "WEIGHING"

    # 5. Weighbridge Weighment
    weigh_payload = {
        "booking_id": booking_id,
        "operator_id": "usr-off-01",
        "gross_weight_quintals": 145.0,
        "tare_weight_quintals": 25.0,
        "bag_count": 240
    }
    wgh_resp = client.post("/api/weighments", json=weigh_payload)
    assert wgh_resp.status_code == 200
    assert wgh_resp.json()["net_weight_quintals"] == 120.0
    assert wgh_resp.json()["status"] == "PROCUREMENT_COMPLETED"

    # 6. Direct Benefit Transfer (DBT) Settlement
    pay_resp = client.post("/api/payments/settle", json={"booking_id": booking_id})
    assert pay_resp.status_code == 200
    pay_data = pay_resp.json()
    assert pay_data["status"] == "PAYMENT_SETTLED"
    assert "DBT-GOI-AGRI-" in pay_data["dbt_transaction_ref"]
    assert pay_data["amount_inr"] > 0

def test_weather_monitoring_and_bhashini():
    # Weather alert scan
    scan = client.post("/api/notifications/weather-alerts/scan")
    assert scan.status_code == 200
    assert "scanned_count" in scan.json()

    # Bhashini voice script
    voice = client.get("/api/notifications/voice-script?booking_token=SIH26-KRN-1001&centre_name=Karnal+Mandi&slot_time=10:00&lang=hi")
    assert voice.status_code == 200
    assert "किसान भाई" in voice.json()["voice_script"]

    # Bhashini languages
    langs = client.get("/api/notifications/languages")
    assert langs.status_code == 200
    assert "hi" in langs.json()
    assert "pa" in langs.json()
