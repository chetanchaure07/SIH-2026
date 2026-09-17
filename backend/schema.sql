-- ============================================================
-- SIH-2026: Polar Energy Management System — Database Schema
-- Run: psql -U <user> -d sih_energy -f schema.sql
-- ============================================================

-- Drop tables in reverse dependency order (safe for re-runs during development)
DROP TABLE IF EXISTS forecast_results CASCADE;
DROP TABLE IF EXISTS weather_data CASCADE;
DROP TABLE IF EXISTS battery_status CASCADE;
DROP TABLE IF EXISTS load_readings CASCADE;
DROP TABLE IF EXISTS energy_readings CASCADE;

-- ---- 1. energy_readings ----------------------------------------
-- Stores power generation readings per source
CREATE TABLE energy_readings (
  id            SERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source        VARCHAR(20) NOT NULL
                  CHECK (source IN ('solar', 'wind', 'diesel', 'battery', 'total_load')),
  power_kw      NUMERIC(10, 3) NOT NULL
);

CREATE INDEX idx_energy_readings_timestamp ON energy_readings (timestamp DESC);
CREATE INDEX idx_energy_readings_source    ON energy_readings (source);

-- ---- 2. load_readings ------------------------------------------
-- Stores electrical load readings by priority group
CREATE TABLE load_readings (
  id            SERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  load_kw       NUMERIC(10, 3) NOT NULL,
  priority      VARCHAR(20) NOT NULL
                  CHECK (priority IN ('critical', 'essential', 'non_critical'))
);

CREATE INDEX idx_load_readings_timestamp ON load_readings (timestamp DESC);
CREATE INDEX idx_load_readings_priority  ON load_readings (priority);

-- ---- 3. battery_status -----------------------------------------
-- Stores battery state of charge, health, and charge/discharge rate
CREATE TABLE battery_status (
  id                  SERIAL PRIMARY KEY,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  soc                 NUMERIC(5, 2) NOT NULL CHECK (soc BETWEEN 0 AND 100),
  health              NUMERIC(5, 2) NOT NULL CHECK (health BETWEEN 0 AND 100),
  charge_discharge_kw NUMERIC(10, 3) NOT NULL
  -- Positive = charging, Negative = discharging (matches frontend BatteryData.currentPowerMW sign)
);

CREATE INDEX idx_battery_status_timestamp ON battery_status (timestamp DESC);

-- ---- 4. weather_data -------------------------------------------
-- Stores weather readings — from Open-Meteo API or manual IoT sensor
CREATE TABLE weather_data (
  id                SERIAL PRIMARY KEY,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  temperature       NUMERIC(6, 2),      -- Celsius
  wind_speed        NUMERIC(6, 2),      -- m/s
  solar_irradiance  NUMERIC(8, 2),      -- W/m²
  cloud_cover       NUMERIC(5, 2),      -- percent (0–100)
  humidity          NUMERIC(5, 2),      -- percent (0–100)
  pressure_hpa      NUMERIC(7, 2),      -- hPa
  weather_code      VARCHAR(30),        -- e.g. 'PARTLY_CLOUDY'
  source            VARCHAR(20) NOT NULL DEFAULT 'open-meteo'
                      CHECK (source IN ('open-meteo', 'local-sensor', 'manual'))
);

CREATE INDEX idx_weather_data_timestamp ON weather_data (timestamp DESC);

-- ---- 5. forecast_results ---------------------------------------
-- Stores computed demand forecast outputs per time horizon
CREATE TABLE forecast_results (
  id                    SERIAL PRIMARY KEY,
  timestamp             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  predicted_demand_kw   NUMERIC(10, 3) NOT NULL,
  forecast_horizon      VARCHAR(10) NOT NULL
                          CHECK (forecast_horizon IN ('1h', '6h', '24h', '7d')),
  confidence_level      VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
                          CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW'))
);

CREATE INDEX idx_forecast_results_timestamp ON forecast_results (timestamp DESC);
CREATE INDEX idx_forecast_results_horizon   ON forecast_results (forecast_horizon);

-- Done
SELECT 'Schema created successfully.' AS status;
