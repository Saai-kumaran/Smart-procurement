-- =============================================================================
-- SIH26032: Smart Agricultural Procurement & Harvest Scheduling Platform
-- Database Schema DDL (Compatible with SQLite and PostgreSQL)
-- =============================================================================

-- 1. Users Table (RBAC: FARMER, OFFICER, ADMIN)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('FARMER', 'OFFICER', 'ADMIN')),
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    aadhaar_hash VARCHAR(64),
    primary_phone VARCHAR(20) NOT NULL,
    village VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    preferred_language VARCHAR(10) DEFAULT 'hi',
    bank_account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Farms Table
CREATE TABLE IF NOT EXISTS farms (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    survey_number VARCHAR(50),
    area_acres REAL NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    boundary_geojson TEXT,
    soil_type VARCHAR(50),
    irrigation_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 4. Crops Table
CREATE TABLE IF NOT EXISTS crops (
    id VARCHAR(36) PRIMARY KEY,
    farm_id VARCHAR(36) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    sowing_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    estimated_quantity_quintals REAL NOT NULL,
    msp_rate_per_quintal REAL DEFAULT 2275.0,
    status VARCHAR(50) DEFAULT 'REGISTERED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 5. Procurement Centres Table
CREATE TABLE IF NOT EXISTS procurement_centres (
    id VARCHAR(36) PRIMARY KEY,
    centre_code VARCHAR(50) UNIQUE NOT NULL,
    centre_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    daily_capacity_quintals REAL NOT NULL DEFAULT 1500.0,
    hourly_capacity_quintals REAL NOT NULL DEFAULT 150.0,
    geofence_radius_meters REAL NOT NULL DEFAULT 500.0,
    operating_hours_start VARCHAR(10) DEFAULT '08:00',
    operating_hours_end VARCHAR(10) DEFAULT '18:00',
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Slots Table
CREATE TABLE IF NOT EXISTS slots (
    id VARCHAR(36) PRIMARY KEY,
    centre_id VARCHAR(36) NOT NULL,
    slot_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    max_capacity_quintals REAL NOT NULL,
    reserved_capacity_quintals REAL NOT NULL DEFAULT 0.0,
    max_vehicles INTEGER DEFAULT 25,
    booked_vehicles INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(id) ON DELETE CASCADE,
    UNIQUE(centre_id, slot_date, start_time)
);

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_token VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(36) NOT NULL,
    centre_id VARCHAR(36) NOT NULL,
    slot_id VARCHAR(36) NOT NULL,
    crop_id VARCHAR(36) NOT NULL,
    booked_quantity_quintals REAL NOT NULL,
    status VARCHAR(50) DEFAULT 'BOOKED',
    qr_token VARCHAR(100) UNIQUE NOT NULL,
    distance_km REAL,
    estimated_travel_minutes REAL,
    weather_risk_level VARCHAR(20) DEFAULT 'LOW',
    crop_maturity_score REAL,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id),
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(id),
    FOREIGN KEY (slot_id) REFERENCES slots(id),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
);

-- 8. Queue Entries Table
CREATE TABLE IF NOT EXISTS queue_entries (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) UNIQUE NOT NULL,
    token_number INTEGER NOT NULL,
    centre_id VARCHAR(36) NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_wait_minutes INTEGER DEFAULT 30,
    current_stage VARCHAR(50) DEFAULT 'WAITING',
    stage_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(id)
);

-- 9. Weather Data Cache Table
CREATE TABLE IF NOT EXISTS weather_data (
    id VARCHAR(36) PRIMARY KEY,
    location_key VARCHAR(100) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    forecast_date DATE NOT NULL,
    temperature_celsius REAL,
    rainfall_mm REAL,
    humidity_percentage REAL,
    weather_condition VARCHAR(100),
    risk_level VARCHAR(20) DEFAULT 'LOW',
    warning_text TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Satellite Observations Table
CREATE TABLE IF NOT EXISTS satellite_observations (
    id VARCHAR(36) PRIMARY KEY,
    farm_id VARCHAR(36) NOT NULL,
    observation_date DATE NOT NULL,
    band_b04_red REAL,
    band_b08_nir REAL,
    ndvi_value REAL NOT NULL,
    cloud_cover_pct REAL DEFAULT 0.0,
    satellite_source VARCHAR(50) DEFAULT 'Sentinel-2',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 11. Crop Predictions Table
CREATE TABLE IF NOT EXISTS crop_predictions (
    id VARCHAR(36) PRIMARY KEY,
    crop_id VARCHAR(36) NOT NULL,
    maturity_score REAL NOT NULL,
    status VARCHAR(50) NOT NULL,
    estimated_days_to_harvest INTEGER NOT NULL,
    prediction_date DATE NOT NULL,
    confidence_score REAL DEFAULT 0.88,
    indicators_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- 12. Centre Capacity Real-Time Table
CREATE TABLE IF NOT EXISTS centre_capacity (
    id VARCHAR(36) PRIMARY KEY,
    centre_id VARCHAR(36) NOT NULL,
    log_date DATE NOT NULL,
    total_arrivals_quintals REAL DEFAULT 0.0,
    processed_quintals REAL DEFAULT 0.0,
    current_queue_count INTEGER DEFAULT 0,
    avg_turnaround_minutes REAL DEFAULT 45.0,
    utilization_pct REAL DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(id) ON DELETE CASCADE
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('SMS', 'IVR', 'PUSH', 'IN_APP')),
    title VARCHAR(150),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) UNIQUE NOT NULL,
    officer_id VARCHAR(36) NOT NULL,
    moisture_percentage REAL NOT NULL,
    foreign_matter_percentage REAL NOT NULL,
    damaged_grains_percentage REAL NOT NULL DEFAULT 1.0,
    quality_grade VARCHAR(20) NOT NULL CHECK (quality_grade IN ('GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECTED')),
    inspection_status VARCHAR(20) DEFAULT 'APPROVED',
    remarks TEXT,
    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (officer_id) REFERENCES users(id)
);

-- 15. Weighments Table
CREATE TABLE IF NOT EXISTS weighments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) UNIQUE NOT NULL,
    operator_id VARCHAR(36) NOT NULL,
    weighbridge_slip_no VARCHAR(50) UNIQUE NOT NULL,
    gross_weight_quintals REAL NOT NULL,
    tare_weight_quintals REAL NOT NULL,
    net_weight_quintals REAL NOT NULL,
    bag_count INTEGER NOT NULL,
    weighed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 16. Payments Table (Simulated DBT Settlement)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) UNIQUE NOT NULL,
    farmer_id VARCHAR(36) NOT NULL,
    msp_rate REAL NOT NULL,
    net_quantity_quintals REAL NOT NULL,
    gross_amount REAL NOT NULL,
    deductions REAL DEFAULT 0.0,
    net_payable_amount REAL NOT NULL,
    dbt_transaction_ref VARCHAR(100) UNIQUE,
    payment_mode VARCHAR(50) DEFAULT 'DBT_AADHAAR_BRIDGE',
    status VARCHAR(50) DEFAULT 'PAYMENT_PROCESSING',
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_slots_centre_date ON slots(centre_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_centre ON bookings(centre_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_queue_centre ON queue_entries(centre_id);
CREATE INDEX IF NOT EXISTS idx_satellite_farm ON satellite_observations(farm_id);
