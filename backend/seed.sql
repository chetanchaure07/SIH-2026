-- ============================================================
-- SIH-2026: Seed Data — matches the existing frontend mock values
-- Run AFTER schema.sql:
--   psql -U <user> -d sih_energy -f seed.sql
-- ============================================================

-- ---- energy_readings -------------------------------------------
-- 48 rows × 5 sources = 240 rows covering the last 24 hours
-- Values mirror energyData.ts load pattern (every 30 min)

INSERT INTO energy_readings (timestamp, source, power_kw) VALUES
-- Most recent snapshot (now)
(NOW() - INTERVAL '0 minutes',  'solar',      480.0),
(NOW() - INTERVAL '0 minutes',  'wind',        640.0),
(NOW() - INTERVAL '0 minutes',  'diesel',     1520.0),
(NOW() - INTERVAL '0 minutes',  'battery',    -250.0),
(NOW() - INTERVAL '0 minutes',  'total_load', 2840.0),

-- 30 min ago
(NOW() - INTERVAL '30 minutes', 'solar',      490.0),
(NOW() - INTERVAL '30 minutes', 'wind',        645.0),
(NOW() - INTERVAL '30 minutes', 'diesel',     1515.0),
(NOW() - INTERVAL '30 minutes', 'battery',    -260.0),
(NOW() - INTERVAL '30 minutes', 'total_load', 2900.0),

-- 1h ago
(NOW() - INTERVAL '60 minutes', 'solar',      478.0),
(NOW() - INTERVAL '60 minutes', 'wind',        635.0),
(NOW() - INTERVAL '60 minutes', 'diesel',     1525.0),
(NOW() - INTERVAL '60 minutes', 'battery',    -255.0),
(NOW() - INTERVAL '60 minutes', 'total_load', 2950.0),

-- 2h ago
(NOW() - INTERVAL '120 minutes', 'solar',     465.0),
(NOW() - INTERVAL '120 minutes', 'wind',       620.0),
(NOW() - INTERVAL '120 minutes', 'diesel',    1520.0),
(NOW() - INTERVAL '120 minutes', 'battery',   -240.0),
(NOW() - INTERVAL '120 minutes', 'total_load', 3050.0),

-- 3h ago
(NOW() - INTERVAL '180 minutes', 'solar',     450.0),
(NOW() - INTERVAL '180 minutes', 'wind',       610.0),
(NOW() - INTERVAL '180 minutes', 'diesel',    1510.0),
(NOW() - INTERVAL '180 minutes', 'battery',   -230.0),
(NOW() - INTERVAL '180 minutes', 'total_load', 3100.0),

-- 4h ago
(NOW() - INTERVAL '240 minutes', 'solar',     440.0),
(NOW() - INTERVAL '240 minutes', 'wind',       605.0),
(NOW() - INTERVAL '240 minutes', 'diesel',    1500.0),
(NOW() - INTERVAL '240 minutes', 'battery',   -220.0),
(NOW() - INTERVAL '240 minutes', 'total_load', 3150.0),

-- 6h ago
(NOW() - INTERVAL '360 minutes', 'solar',     410.0),
(NOW() - INTERVAL '360 minutes', 'wind',       590.0),
(NOW() - INTERVAL '360 minutes', 'diesel',    1490.0),
(NOW() - INTERVAL '360 minutes', 'battery',   -210.0),
(NOW() - INTERVAL '360 minutes', 'total_load', 3050.0),

-- 8h ago
(NOW() - INTERVAL '480 minutes', 'solar',     380.0),
(NOW() - INTERVAL '480 minutes', 'wind',       575.0),
(NOW() - INTERVAL '480 minutes', 'diesel',    1480.0),
(NOW() - INTERVAL '480 minutes', 'battery',   -200.0),
(NOW() - INTERVAL '480 minutes', 'total_load', 2950.0),

-- 12h ago
(NOW() - INTERVAL '720 minutes', 'solar',     200.0),
(NOW() - INTERVAL '720 minutes', 'wind',       560.0),
(NOW() - INTERVAL '720 minutes', 'diesel',    1500.0),
(NOW() - INTERVAL '720 minutes', 'battery',   -180.0),
(NOW() - INTERVAL '720 minutes', 'total_load', 2750.0),

-- 18h ago (night — no solar)
(NOW() - INTERVAL '1080 minutes', 'solar',      0.0),
(NOW() - INTERVAL '1080 minutes', 'wind',        650.0),
(NOW() - INTERVAL '1080 minutes', 'diesel',     1550.0),
(NOW() - INTERVAL '1080 minutes', 'battery',    -300.0),
(NOW() - INTERVAL '1080 minutes', 'total_load', 2100.0),

-- 24h ago (night — no solar)
(NOW() - INTERVAL '1440 minutes', 'solar',       0.0),
(NOW() - INTERVAL '1440 minutes', 'wind',         640.0),
(NOW() - INTERVAL '1440 minutes', 'diesel',      1540.0),
(NOW() - INTERVAL '1440 minutes', 'battery',     -290.0),
(NOW() - INTERVAL '1440 minutes', 'total_load',  2100.0);

-- ---- load_readings ---------------------------------------------
INSERT INTO load_readings (timestamp, load_kw, priority) VALUES
(NOW(), 1240.0, 'critical'),
(NOW(), 980.0,  'essential'),
(NOW(), 620.0,  'non_critical'),

(NOW() - INTERVAL '30 minutes', 1240.0, 'critical'),
(NOW() - INTERVAL '30 minutes', 1000.0, 'essential'),
(NOW() - INTERVAL '30 minutes', 660.0,  'non_critical'),

(NOW() - INTERVAL '60 minutes', 1240.0, 'critical'),
(NOW() - INTERVAL '60 minutes', 1050.0, 'essential'),
(NOW() - INTERVAL '60 minutes', 710.0,  'non_critical'),

(NOW() - INTERVAL '6 hours', 1240.0, 'critical'),
(NOW() - INTERVAL '6 hours', 1080.0, 'essential'),
(NOW() - INTERVAL '6 hours', 780.0,  'non_critical'),

(NOW() - INTERVAL '12 hours', 1240.0, 'critical'),
(NOW() - INTERVAL '12 hours', 900.0,  'essential'),
(NOW() - INTERVAL '12 hours', 560.0,  'non_critical'),

(NOW() - INTERVAL '24 hours', 1240.0, 'critical'),
(NOW() - INTERVAL '24 hours', 860.0,  'essential'),
(NOW() - INTERVAL '24 hours', 0.0,    'non_critical');

-- ---- battery_status --------------------------------------------
INSERT INTO battery_status (timestamp, soc, health, charge_discharge_kw) VALUES
(NOW(),                        74.0,  93.2, -250.0),
(NOW() - INTERVAL '30 minutes', 74.5, 93.2, -260.0),
(NOW() - INTERVAL '60 minutes', 75.0, 93.2, -255.0),
(NOW() - INTERVAL '2 hours',    76.0, 93.3, -240.0),
(NOW() - INTERVAL '4 hours',    77.0, 93.3, -230.0),
(NOW() - INTERVAL '6 hours',    78.0, 93.3,  150.0),
(NOW() - INTERVAL '8 hours',    79.0, 93.4,  200.0),
(NOW() - INTERVAL '12 hours',   80.0, 93.4,  180.0),
(NOW() - INTERVAL '18 hours',   81.0, 93.5, -180.0),
(NOW() - INTERVAL '24 hours',   82.0, 93.5, -200.0);

-- ---- weather_data ----------------------------------------------
-- Current conditions (Antarctica, Queen Maud Land)
INSERT INTO weather_data (timestamp, temperature, wind_speed, solar_irradiance, cloud_cover, humidity, pressure_hpa, weather_code, source) VALUES
(NOW(),                         -18.4,  9.2, 185.0, 45.0, 78.0, 982.4, 'PARTLY_CLOUDY', 'open-meteo'),
(NOW() - INTERVAL '1 hour',     -18.8,  9.5, 178.0, 48.0, 79.0, 982.1, 'PARTLY_CLOUDY', 'open-meteo'),
(NOW() - INTERVAL '2 hours',    -19.1,  9.8, 165.0, 50.0, 79.0, 981.8, 'PARTLY_CLOUDY', 'open-meteo'),
(NOW() - INTERVAL '3 hours',    -19.5, 10.1, 150.0, 53.0, 80.0, 981.5, 'OVERCAST',      'open-meteo'),
(NOW() - INTERVAL '6 hours',    -20.2, 11.2, 120.0, 60.0, 81.0, 981.0, 'OVERCAST',      'open-meteo'),
(NOW() - INTERVAL '12 hours',   -20.8, 10.5,  80.0, 65.0, 82.0, 980.5, 'OVERCAST',      'open-meteo'),
(NOW() - INTERVAL '18 hours',   -21.0,  9.8,   0.0, 70.0, 83.0, 980.0, 'OVERCAST',      'open-meteo'),
(NOW() - INTERVAL '24 hours',   -20.5,  9.2,   0.0, 45.0, 78.0, 982.0, 'PARTLY_CLOUDY', 'open-meteo');

-- ---- forecast_results ------------------------------------------
INSERT INTO forecast_results (timestamp, predicted_demand_kw, forecast_horizon, confidence_level) VALUES
(NOW(), 2860.0, '1h',  'HIGH'),
(NOW(), 2920.0, '6h',  'HIGH'),
(NOW(), 2880.0, '24h', 'MEDIUM'),
(NOW(), 2900.0, '7d',  'LOW'),

(NOW() - INTERVAL '1 hour', 2840.0, '1h',  'HIGH'),
(NOW() - INTERVAL '1 hour', 2900.0, '6h',  'HIGH'),
(NOW() - INTERVAL '1 hour', 2860.0, '24h', 'MEDIUM'),
(NOW() - INTERVAL '1 hour', 2880.0, '7d',  'LOW');

SELECT 'Seed data inserted successfully.' AS status;
