
CREATE TABLE drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnic VARCHAR(15) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    password TEXT, -- if driver has app access
    license_number VARCHAR(30) UNIQUE NOT NULL,
    license_expiry DATE,
    date_of_birth DATE,
    age INT,
    gender VARCHAR(10), -- 'male', 'female', 'other'
    address TEXT,
    city VARCHAR(50),
    profile_image_url TEXT DEFAULT NULL,
    experience_years INT,
    -- Driver status
    is_active BOOLEAN DEFAULT TRUE,
    -- verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    risk_score FLOAT DEFAULT 0.0, -- calculated based on history
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- INSERT INTO drivers(
--     cnic,
--     -- company_id,
--     full_name,
--     phone_number,
--     email,
--     password,
--     license_number,
--     license_expiry,
--     date_of_birth,
--     age,
--     gender,
--     address,
--     city,
--     profile_image_url,
--     experience_years,
--     is_active,
--     risk_score
-- )
-- VALUES (
--     '4210112345671',
--     -- '10443b1b-19e3-465c-a3e4-19cebb3fefe1',   -- replace with actual company_id
--     'Muhammad Ali',
--     '0311-1234567',
--     'ali.driver@example.com',
--     'driver_password',
--     'LIC-789456123',
--     '2027-05-20',
--     '1990-10-15',
--     34,
--     'male',
--     'Federal B Area, Street 9',
--     'Karachi',
--     NULL,
--     5,
--     TRUE,
--     0.0
-- );


-- INSERT INTO drivers (
--     cnic,
--     company_id,
--     full_name,
--     phone_number,
--     email,
--     password,
--     license_number,
--     license_expiry,
--     date_of_birth,
--     age,
--     gender,
--     address,
--     city,
--     profile_image_url,
--     experience_years,
--     is_active,
--     risk_score
-- )
-- VALUES (
--     '4220198765432',
--     'a3af90df-5a28-4400-b974-29c5606f12ed',   -- sample company_id
--     'Magan Don',
--     '0305-9876543',
--     'magan123@example.com',
--     'secure_password123',
--     'LIC-456789321',
--     '2028-11-12',
--     '1988-03-22',
--     36,
--     'male',
--     'Gada Electronics, Block H',
--     'Mumbai',
--     NULL,
--     7,
--     TRUE,
--     1.5
-- );


-- -- Driver Sessions (monitoring sessions)
CREATE TABLE driver_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(driver_id) ON DELETE CASCADE,
    cnic VARCHAR(15) REFERENCES drivers(cnic) ON DELETE CASCADE,
    -- company_id UUID REFERENCES companies(company_id) ON DELETE NULL,
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    
    -- Session timing
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP DEFAULT NULL,
    total_duration INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED,
    -- Session metrics
    total_frames_processed INT DEFAULT 0,
    alert_frames INT DEFAULT 0,
    drowsy_frames INT DEFAULT 0,
    distracted_frames INT DEFAULT 0,
    average_confidence FLOAT DEFAULT 0,
    attention_score FLOAT DEFAULT 0, -- percentage of time alert
    -- Session status
    session_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'interrupted', 'error'
    termination_reason TEXT DEFAULT NULL, -- if interrupted
    -- Location data (Phase 2 - GPS)
    -- start_location JSONB, -- {lat, lng, address}
    -- end_location JSONB,
    -- route_data JSONB, -- array of GPS points
    -- total_distance_km FLOAT,
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- INSERT INTO driver_sessions (
--     driver_id,
--     cnic
-- ) VALUES (
--     '2d0b446e-eff5-4c7d-bf0e-6078e197ee2d',
--     '4220198765432'
-- );


-- Companies (fleet operators, schools, bus services)
CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    company_type VARCHAR(50), -- 'school', 'bus_service', 'ride_hailing', 'general'
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    contact_number VARCHAR(20),
    company_address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Pakistan',
    subscription_plan VARCHAR(30) DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    subscription_expiry DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- INSERT INTO companies (
--     company_name,
--     company_type,
--     email,
--     password,
--     contact_number,
--     company_address,
--     city,
--     subscription_plan,
--     subscription_status,
--     subscription_expiry,
--     is_verified
-- )
-- VALUES
-- (
--     'Daewoo',
--     'Bus Service',
--     'contact@daewoo.pk',
--     'daewoo123',
--     '+92-300-1112233',
--     'Street 12, Sector F-10',
--     'Karachi',
--     'premium',
--     'active',
--     '2027-01-01',
--     TRUE
-- ),
-- (
--     'Faisal Movers',
--     'Bus Service',
--     'info@movers.pk',
--     'movers123',
--     '+92-321-5557788',
--     'Main GT Road',
--     'Lahore',
--     'enterprise',
--     'active',
--     '2026-06-30',
--     TRUE
-- ),
-- (
--     'Chacha Service',
--     'Bus Service',
--     'contact@chacha.pk',
--     'chacha123',
--     '+92-333-9990001',
--     'Office 5, Tech Plaza',
--     'Karachi',
--     'basic',
--     'active',
--     '2026-12-31',
--     FALSE
-- );


-- Vehicles (optional for Phase 2, but good to have structure)
CREATE TABLE vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    vehicle_number VARCHAR(30) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50), -- 'van', 'bus', 'car'
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- INSERT INTO vehicles (
--     company_id,
--     vehicle_number,
--     vehicle_type,
--     make,
--     model,
--     year,
--     is_active
-- )
-- VALUES
-- (
--     '1b59751c-e479-4ed9-82e6-a0bb9d6885aa',
--     'ISB-SCH-001',
--     'van',
--     'Toyota',
--     'Hiace',
--     2019,
--     TRUE
-- );
-- ,(
--     (SELECT company_id FROM companies WHERE company_name = 'City Bus Services'),
--     'LHR-BUS-101',
--     'bus',
--     'Hino',
--     'RK8',
--     2021,
--     TRUE
-- ),
-- (
--     (SELECT company_id FROM companies WHERE company_name = 'QuickRide Pvt Ltd'),
--     'KHI-QR-778',
--     'car',
--     'Suzuki',
--     'Cultus',
--     2022,
--     TRUE
-- ),
-- (
--     NULL,
--     'UNASSIGNED-01',
--     'van',
--     'Nissan',
--     'Caravan',
--     2018,
--     FALSE
-- );



-- Admin Users (system administrators)
CREATE TABLE admin_users (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnic VARCHAR(15) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- bcrypt hash
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    -- role VARCHAR(20) DEFAULT 'admin', -- 'admin', 'super_admin'
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- INSERT INTO admin_users (
--     cnic,
--     username,
--     password,
--     email,
--     full_name,
--     is_active
-- )
-- VALUES
-- (
--     '3520212345671',
--     'admin01',
--     'admin123',
--     'admin@system.com',
--     'Shaukat',
--     TRUE
-- )
-- ,(
--     '42101-9876543-2',
--     'superadmin',
--     '$2b$10$mockadminhash2',
--     'superadmin@system.com',
--     'Super Admin',
--     TRUE
-- )
;

-- Fatigue Events (individual detections)
CREATE TABLE fatigue_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES driver_sessions(session_id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(driver_id) ON DELETE CASCADE,
    -- cnic VARCHAR(15) REFERENCES drivers(cnic) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
    -- Event details
    timestamp TIMESTAMP DEFAULT NOW(),
    -- event_type VARCHAR(50) NOT NULL, -- 'DROWSY', 'DISTRACTED', 'Alert', 'EYE_CLOSURE', 'HEAD_NOD', 'PHONE_USE', etc.
    
    state VARCHAR(20) NOT NULL, -- 'ALERT', 'DROWSY', 'DISTRACTED'
    -- state VARCHAR(20) NOT NULL CHECK (state IN ('ALERT','DROWSY','DISTRACTED')),

    confidence FLOAT, -- model confidence (0-1)
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    -- Feature values (for analysis)
    features JSONB, -- {ear: 0.15, mar: 0.45, head_pose: {...}, occlusion: false}
    -- Occlusion info (FALSE POSITIVE HANDLING!)
    occlusion_detected BOOLEAN DEFAULT FALSE,
    occlusion_type VARCHAR(30) default null, -- 'shawl', 'sunglasses', 'hand', 'phone', null
    face_visibility_score FLOAT, -- 0-1 (how much of face is visible)
    -- Alert info
    -- alert_triggered BOOLEAN DEFAULT FALSE,
    -- alert_acknowledged BOOLEAN DEFAULT FALSE,
    -- Frame data (optional, for debugging)
    frame_image_url TEXT, -- S3/cloud storage URL
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);


-- Alerts (notifications sent to driver/company)
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES fatigue_events(event_id) ON DELETE CASCADE,
    session_id UUID REFERENCES driver_sessions(session_id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(driver_id) ON DELETE CASCADE,
    -- cnic VARCHAR(15) REFERENCES drivers(cnic) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    -- Alert details
    alert_type VARCHAR(30) NOT NULL, -- 'audio', 'visual', 'vibration', 'push_notification'
    alert_message TEXT NOT NULL,
    -- severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    -- Alert status
    delivered BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    response_time INTERVAL, -- time taken to acknowledge
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);



-- Dashboard Metrics (aggregated statistics)
CREATE TABLE dashboard_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(driver_id) ON DELETE CASCADE,
    -- cnic VARCHAR(15) REFERENCES drivers(cnic),
    -- Time period
    -- period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily','weekly','monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Aggregated metrics
    total_sessions INT DEFAULT 0,
    total_duration INTERVAL,
    -- total_distance_km FLOAT, -- Phase 2
    total_events INT DEFAULT 0,
    drowsy_events INT DEFAULT 0,
    distracted_events INT DEFAULT 0,
    high_risk_events INT DEFAULT 0,
    total_alerts INT DEFAULT 0,
    average_attention_score FLOAT,
    average_confidence FLOAT,
    -- Risk assessment
    risk_score FLOAT, -- calculated risk for this period
    risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    -- Metadata
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    -- UNIQUE(company_id, driver_id, period_type, period_start)
);



CREATE OR REPLACE VIEW company_dashboard_view AS
WITH
session_base AS (
    SELECT
        ds.session_id,
        ds.driver_id,
        ds.company_id,
        ds.session_status,
        ds.total_duration,
        ds.attention_score
    FROM driver_sessions ds
),
event_agg AS (
    SELECT
        fe.session_id,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE fe.state = 'DROWSY') AS drowsy_events,
        COUNT(*) FILTER (WHERE fe.state = 'DISTRACTED') AS distracted_events
    FROM fatigue_events fe
    GROUP BY fe.session_id
),
alert_agg AS (
    SELECT
        a.session_id,
        COUNT(*) AS total_alerts
    FROM alerts a
    GROUP BY a.session_id
)
SELECT
    c.company_id,
    c.company_name,
    c.city,

    COUNT(DISTINCT d.driver_id) AS total_drivers,
    COUNT(DISTINCT d.driver_id) FILTER (WHERE d.is_active = TRUE) AS active_drivers,

    COUNT(DISTINCT sb.session_id) AS total_sessions,
    COUNT(DISTINCT sb.session_id) FILTER (WHERE sb.session_status = 'active') AS active_sessions,

    COALESCE(SUM(EXTRACT(EPOCH FROM sb.total_duration)) / 3600, 0) AS total_hours_driven,

    COALESCE(SUM(ea.total_events), 0) AS total_events,
    COALESCE(SUM(ea.drowsy_events), 0) AS drowsy_events,
    COALESCE(SUM(ea.distracted_events), 0) AS distracted_events,

    COALESCE(SUM(aa.total_alerts), 0) AS total_alerts,

    AVG(sb.attention_score) AS avg_attention_score,
    AVG(d.risk_score) AS avg_risk_score,

    COUNT(DISTINCT d.driver_id) FILTER (WHERE d.risk_score > 70) AS high_risk_drivers

FROM companies c
LEFT JOIN drivers d
    ON c.company_id = d.company_id
LEFT JOIN session_base sb
    ON d.driver_id = sb.driver_id
LEFT JOIN event_agg ea
    ON sb.session_id = ea.session_id
LEFT JOIN alert_agg aa
    ON sb.session_id = aa.session_id
GROUP BY c.company_id, c.company_name, c.city;




CREATE OR REPLACE VIEW admin_dashboard_view AS
WITH
session_base AS (
    SELECT
        ds.session_id,
        ds.driver_id,
        ds.company_id,
        ds.session_status,
        ds.attention_score
    FROM driver_sessions ds
),
event_agg AS (
    SELECT
        fe.session_id,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE fe.state = 'DROWSY') AS drowsy_events,
        COUNT(*) FILTER (WHERE fe.state = 'DISTRACTED') AS distracted_events
    FROM fatigue_events fe
    GROUP BY fe.session_id
),
alert_agg AS (
    SELECT
        a.session_id,
        COUNT(*) AS total_alerts
    FROM alerts a
    GROUP BY a.session_id
)
SELECT
    COUNT(DISTINCT c.company_id) AS total_companies,
    COUNT(DISTINCT c.company_id) FILTER (WHERE c.is_verified = TRUE) AS verified_companies,
    COUNT(DISTINCT c.company_id) FILTER (WHERE c.subscription_status = 'active') AS active_companies,

    COUNT(DISTINCT d.driver_id) AS total_drivers,
    COUNT(DISTINCT d.driver_id) FILTER (WHERE d.is_active = TRUE) AS active_drivers,

    COUNT(DISTINCT sb.session_id) AS total_sessions,
    COUNT(DISTINCT sb.session_id) FILTER (WHERE sb.session_status = 'active') AS active_sessions,

    COALESCE(SUM(ea.total_events), 0) AS total_events,
    COALESCE(SUM(ea.drowsy_events), 0) AS drowsy_events,
    COALESCE(SUM(ea.distracted_events), 0) AS distracted_events,

    COALESCE(SUM(aa.total_alerts), 0) AS total_alerts,

    AVG(sb.attention_score) AS avg_attention_score,
    AVG(d.risk_score) AS avg_risk_score

FROM companies c
LEFT JOIN drivers d
    ON c.company_id = d.company_id
LEFT JOIN session_base sb
    ON d.driver_id = sb.driver_id
LEFT JOIN event_agg ea
    ON sb.session_id = ea.session_id
LEFT JOIN alert_agg aa
    ON sb.session_id = aa.session_id;


ALTER TABLE drivers
ADD COLUMN assigned_vehicle_id UUID NULL;

ALTER TABLE drivers
ADD CONSTRAINT fk_drivers_assigned_vehicle
FOREIGN KEY (assigned_vehicle_id)
REFERENCES vehicles(vehicle_id)
ON DELETE SET NULL;
