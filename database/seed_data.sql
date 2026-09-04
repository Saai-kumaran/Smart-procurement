-- =============================================================================
-- SIH26032: Seed Data for Agricultural Procurement & Scheduling Platform
-- Pre-populated Realistic Clusters (Haryana, Punjab, Telangana, Maharashtra)
-- =============================================================================

-- 1. Users (Passwords hashed for: 'admin123', 'officer123', 'farmer123')
-- Pre-hashed with bcrypt or SHA256 fallback compatibility
INSERT OR REPLACE INTO users (id, username, email, phone, hashed_password, role, full_name, is_active) VALUES
('usr-admin-01', 'admin', 'admin@sih26032.gov.in', '9800000000', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'ADMIN', 'Dr. Arvind Sharma (Joint Director, Agriculture)', 1),
('usr-off-01', 'officer_karnal', 'officer.karnal@sih26032.gov.in', '9811111111', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'OFFICER', 'Rajesh Verma (Procurement Superintendent)', 1),
('usr-off-02', 'officer_nizamabad', 'officer.nizamabad@sih26032.gov.in', '9822222222', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'OFFICER', 'K. Venkat Rao (Mandi Officer)', 1),
('usr-off-03', 'officer_nashik', 'officer.nashik@sih26032.gov.in', '9833333333', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'OFFICER', 'Sunil Jadhav (APMC Inspector)', 1),
('usr-farm-01', 'ramesh_kumar', 'ramesh.farmer@gmail.com', '9876543210', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'FARMER', 'Ramesh Kumar', 1),
('usr-farm-02', 'balwinder_singh', 'balwinder.farmer@gmail.com', '9876543211', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'FARMER', 'Sardar Balwinder Singh', 1),
('usr-farm-03', 'suresh_patil', 'suresh.patil@gmail.com', '9876543212', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'FARMER', 'Suresh Patil', 1),
('usr-farm-04', 'lakshman_rao', 'lakshman.rao@gmail.com', '9876543213', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W65WVOnwqshP1Geq', 'FARMER', 'Lakshman Rao', 1);

-- 2. Farmers
INSERT OR REPLACE INTO farmers (id, user_id, aadhaar_hash, primary_phone, village, block, district, state, pincode, preferred_language, bank_account_no, ifsc_code) VALUES
('frm-01', 'usr-farm-01', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '9876543210', 'Uchana', 'Karnal', 'Karnal', 'Haryana', '132001', 'hi', 'SBIN0001234567', 'SBIN0001234'),
('frm-02', 'usr-farm-02', 'cf83ac130d1a8b3029f188365451400010e40e69888126b9117cf48796122d25', '9876543211', 'Samana', 'Khanna', 'Ludhiana', 'Punjab', '141401', 'pa', 'PUNB0009876543', 'PUNB0009876'),
('frm-03', 'usr-farm-03', 'a35a82f3a74259790c376d7f82b3b7e65f12da9f074ce91ec03197f1b86b3e15', '9876543212', 'Dindori', 'Dindori', 'Nashik', 'Maharashtra', '422202', 'mr', 'MAHB0004567890', 'MAHB0004567'),
('frm-04', 'usr-farm-04', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '9876543213', 'Armoor', 'Armoor', 'Nizamabad', 'Telangana', '503224', 'te', 'UBIN0006543210', 'UBIN0006543');

-- 3. Farms
INSERT OR REPLACE INTO farms (id, farmer_id, survey_number, area_acres, latitude, longitude, boundary_geojson, soil_type, irrigation_source) VALUES
('farm-01', 'frm-01', 'SY-104/A', 5.5, 29.7214, 76.9621, '{"type":"Polygon","coordinates":[[[76.960,29.720],[76.964,29.720],[76.964,29.723],[76.960,29.723],[76.960,29.720]]]}', 'Alluvial Loam', 'Tube Well & Canal'),
('farm-02', 'frm-02', 'SY-42/B', 8.0, 30.7250, 76.1950, '{"type":"Polygon","coordinates":[[[76.192,30.722],[76.198,30.722],[76.198,30.728],[76.192,30.728],[76.192,30.722]]]}', 'Clay Loam', 'Canal'),
('farm-03', 'frm-03', 'SY-88', 4.2, 20.0210, 73.8150, '{"type":"Polygon","coordinates":[[[73.812,20.019],[73.818,20.019],[73.818,20.023],[73.812,20.023],[73.812,20.019]]]}', 'Black Soil', 'Drip Irrigation'),
('farm-04', 'frm-04', 'SY-15', 6.0, 18.6910, 78.1120, '{"type":"Polygon","coordinates":[[[78.108,18.688],[78.115,18.688],[78.115,18.694],[78.108,18.694],[78.108,18.688]]]}', 'Red Loam', 'Borewell');

-- 4. Crops
INSERT OR REPLACE INTO crops (id, farm_id, crop_name, variety, sowing_date, expected_harvest_date, estimated_quantity_quintals, msp_rate_per_quintal, status) VALUES
('crop-01', 'farm-01', 'Wheat', 'PBW-550', '2026-11-15', '2026-09-08', 120.0, 2275.0, 'NEAR_HARVEST'),
('crop-02', 'farm-02', 'Wheat', 'HD-3086', '2026-11-18', '2026-09-09', 180.0, 2275.0, 'NEAR_HARVEST'),
('crop-03', 'farm-03', 'Soybean', 'JS-335', '2026-06-20', '2026-09-12', 80.0, 4600.0, 'GROWING'),
('crop-04', 'farm-04', 'Paddy', 'Basmati-1121', '2026-06-10', '2026-09-07', 150.0, 2300.0, 'READY');

-- 5. Procurement Centres
INSERT OR REPLACE INTO procurement_centres (id, centre_code, centre_name, district, state, latitude, longitude, daily_capacity_quintals, hourly_capacity_quintals, geofence_radius_meters, operating_hours_start, operating_hours_end, contact_phone, is_active) VALUES
('cnt-01', 'PC-HR-KARNAL-01', 'Karnal Main Anaj Mandi', 'Karnal', 'Haryana', 29.6857, 76.9905, 2000.0, 200.0, 600.0, '08:00', '18:00', '0184-2250101', 1),
('cnt-02', 'PC-HR-TARAORI-02', 'Taraori Grain Procurement Centre', 'Karnal', 'Haryana', 29.8000, 76.9300, 1200.0, 120.0, 500.0, '08:00', '17:30', '0184-2450202', 1),
('cnt-03', 'PC-PB-KHANNA-01', 'Khanna Asia Grain Market', 'Ludhiana', 'Punjab', 30.7073, 76.2198, 3500.0, 350.0, 800.0, '07:30', '19:00', '01628-220303', 1),
('cnt-04', 'PC-TS-NIZAM-01', 'Nizamabad Agricultural Market', 'Nizamabad', 'Telangana', 18.6725, 78.0941, 1800.0, 180.0, 500.0, '08:00', '18:00', '08462-230404', 1),
('cnt-05', 'PC-MH-NASHIK-01', 'Nashik Dindori APMC Sub-Yard', 'Nashik', 'Maharashtra', 19.9975, 73.7898, 1500.0, 150.0, 500.0, '08:30', '18:00', '0253-2570505', 1);

-- 6. Slots (Generated across today and upcoming days)
INSERT OR REPLACE INTO slots (id, centre_id, slot_date, start_time, end_time, max_capacity_quintals, reserved_capacity_quintals, max_vehicles, booked_vehicles, status) VALUES
('slot-karnal-d1-s1', 'cnt-01', '2026-09-05', '08:00', '10:00', 400.0, 180.0, 20, 8, 'OPEN'),
('slot-karnal-d1-s2', 'cnt-01', '2026-09-05', '10:00', '12:00', 400.0, 320.0, 20, 15, 'OPEN'),
('slot-karnal-d1-s3', 'cnt-01', '2026-09-05', '13:00', '15:00', 400.0, 110.0, 20, 5, 'OPEN'),
('slot-karnal-d1-s4', 'cnt-01', '2026-09-05', '15:00', '17:00', 400.0, 50.0, 20, 2, 'OPEN'),

('slot-karnal-d2-s1', 'cnt-01', '2026-09-06', '08:00', '10:00', 400.0, 60.0, 20, 3, 'OPEN'),
('slot-karnal-d2-s2', 'cnt-01', '2026-09-06', '10:00', '12:00', 400.0, 90.0, 20, 4, 'OPEN'),
('slot-karnal-d2-s3', 'cnt-01', '2026-09-06', '13:00', '15:00', 400.0, 40.0, 20, 2, 'OPEN'),

('slot-taraori-d1-s1', 'cnt-02', '2026-09-05', '09:00', '11:00', 300.0, 80.0, 15, 4, 'OPEN'),
('slot-taraori-d1-s2', 'cnt-02', '2026-09-05', '11:00', '13:00', 300.0, 150.0, 15, 7, 'OPEN'),
('slot-taraori-d2-s1', 'cnt-02', '2026-09-06', '09:00', '11:00', 300.0, 40.0, 15, 2, 'OPEN');

-- 7. Existing Bookings (Showcases diverse stages of Mandi Workflow)
INSERT OR REPLACE INTO bookings (id, booking_token, farmer_id, centre_id, slot_id, crop_id, booked_quantity_quintals, status, qr_token, distance_km, estimated_travel_minutes, weather_risk_level, crop_maturity_score) VALUES
('bkg-01', 'SIH26-KRN-1001', 'frm-01', 'cnt-01', 'slot-karnal-d1-s2', 'crop-01', 50.0, 'CHECKED_IN', 'QR-SIH-9876543210-1001', 7.4, 18.0, 'LOW', 86.5),
('bkg-02', 'SIH26-KRN-1002', 'frm-02', 'cnt-01', 'slot-karnal-d1-s1', 'crop-02', 75.0, 'PROCUREMENT_COMPLETED', 'QR-SIH-9876543211-1002', 12.8, 30.0, 'LOW', 91.0),
('bkg-03', 'SIH26-TAR-2001', 'frm-01', 'cnt-02', 'slot-taraori-d1-s1', 'crop-01', 40.0, 'BOOKED', 'QR-SIH-9876543210-2001', 11.2, 24.0, 'LOW', 82.0);

-- 8. Queue Entries
INSERT OR REPLACE INTO queue_entries (id, booking_id, token_number, centre_id, estimated_wait_minutes, current_stage) VALUES
('qe-01', 'bkg-01', 101, 'cnt-01', 15, 'INSPECTION'),
('qe-02', 'bkg-02', 102, 'cnt-01', 0, 'PROCUREMENT_COMPLETED');

-- 9. Inspections
INSERT OR REPLACE INTO inspections (id, booking_id, officer_id, moisture_percentage, foreign_matter_percentage, damaged_grains_percentage, quality_grade, inspection_status, remarks) VALUES
('insp-01', 'bkg-01', 'usr-off-01', 11.8, 0.4, 0.5, 'GRADE_A', 'APPROVED', 'Grain quality is optimal. Low moisture within acceptable standard (under 12%).'),
('insp-02', 'bkg-02', 'usr-off-01', 12.2, 0.6, 0.8, 'GRADE_A', 'APPROVED', 'Standard FAQ specifications met.');

-- 10. Weighments
INSERT OR REPLACE INTO weighments (id, booking_id, operator_id, weighbridge_slip_no, gross_weight_quintals, tare_weight_quintals, net_weight_quintals, bag_count) VALUES
('wgh-02', 'bkg-02', 'usr-off-01', 'WB-KRN-2026-0891', 102.5, 27.5, 75.0, 150);

-- 11. Payments (DBT Settlement for bkg-02)
INSERT OR REPLACE INTO payments (id, booking_id, farmer_id, msp_rate, net_quantity_quintals, gross_amount, deductions, net_payable_amount, dbt_transaction_ref, payment_mode, status, settled_at) VALUES
('pay-02', 'bkg-02', 'frm-02', 2275.0, 75.0, 170625.0, 0.0, 170625.0, 'DBT-GOI-AGRI-20260904-899120', 'DBT_AADHAAR_BRIDGE', 'PAYMENT_SETTLED', CURRENT_TIMESTAMP);

-- 12. Satellite Observations (NDVI time-series)
INSERT OR REPLACE INTO satellite_observations (id, farm_id, observation_date, band_b04_red, band_b08_nir, ndvi_value, cloud_cover_pct, satellite_source) VALUES
('sat-01', 'farm-01', '2026-08-15', 0.12, 0.55, 0.64, 4.2, 'Sentinel-2'),
('sat-02', 'farm-01', '2026-08-25', 0.09, 0.62, 0.74, 2.0, 'Sentinel-2'),
('sat-03', 'farm-01', '2026-09-02', 0.08, 0.65, 0.78, 1.5, 'Sentinel-2'),
('sat-04', 'farm-02', '2026-09-02', 0.07, 0.68, 0.81, 3.0, 'Sentinel-2');

-- 13. Weather Data Cache
INSERT OR REPLACE INTO weather_data (id, location_key, latitude, longitude, forecast_date, temperature_celsius, rainfall_mm, humidity_percentage, weather_condition, risk_level, warning_text) VALUES
('wth-01', 'Karnal_HR', 29.6857, 76.9905, '2026-09-05', 31.5, 0.0, 58.0, 'Clear Sky', 'LOW', 'Dry conditions favorable for harvesting and mandi transit.'),
('wth-02', 'Karnal_HR', 29.6857, 76.9905, '2026-09-06', 32.0, 2.5, 62.0, 'Partly Cloudy', 'LOW', 'Light isolated drizzle, low risk.'),
('wth-03', 'Karnal_HR', 29.6857, 76.9905, '2026-09-07', 28.0, 35.0, 85.0, 'Heavy Thunderstorm', 'HIGH', 'IMD Warning: Moderate to heavy rain expected. Harvest and transit delay recommended.'),
('wth-04', 'Karnal_HR', 29.6857, 76.9905, '2026-09-08', 30.0, 4.0, 68.0, 'Clearing Skies', 'MEDIUM', 'Post-rain drying conditions.');

-- 14. Centre Capacity Metrics
INSERT OR REPLACE INTO centre_capacity (id, centre_id, log_date, total_arrivals_quintals, processed_quintals, current_queue_count, avg_turnaround_minutes, utilization_pct) VALUES
('cc-01', 'cnt-01', '2026-09-04', 1650.0, 1480.0, 4, 38.5, 82.5),
('cc-02', 'cnt-02', '2026-09-04', 850.0, 790.0, 2, 32.0, 70.8),
('cc-03', 'cnt-03', '2026-09-04', 2900.0, 2750.0, 7, 45.0, 82.8);
