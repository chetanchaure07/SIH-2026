# SIH-2026 — Python ML Module

Standalone Ridge Regression forecasting script for the Polar Energy Management System.

## What it does

1. Connects to the existing PostgreSQL database (`sih_energy`)
2. Reads historical load data from `energy_readings` (where `source = 'total_load'`)
3. Reads weather features from `weather_data`
4. Merges them by nearest timestamp (up to ±4 h tolerance)
5. Trains a **scikit-learn Ridge Regression** model
6. Evaluates the model: MAE, RMSE, R²
7. Generates demand forecasts for 1 h, 6 h, 24 h, 7 d ahead
8. POSTs each result to the existing Node.js endpoint:
   `POST http://localhost:3001/api/forecast/results`
9. Prints a clear terminal summary

---

## Directory layout

```
backend/ml/
├── .env          ← your real credentials (NOT committed, in .gitignore)
├── .env.example  ← template (safe to commit)
├── requirements.txt
├── forecast.py   ← main script
└── README.md
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python ≥ 3.10 | `python --version` |
| PostgreSQL running | `sih_energy` database must exist |
| `schema.sql` applied | `psql -U postgres -d sih_energy -f backend/schema.sql` |
| `seed.sql` applied | `psql -U postgres -d sih_energy -f backend/seed.sql` |
| Node.js backend running | `cd backend && npm run dev` (port 3001) |

---

## Setup

```powershell
# From the project root
cd "backend\ml"

# 1 — Install Python dependencies
pip install -r requirements.txt

# 2 — Configure credentials
#     The .env file already exists with a placeholder.
#     Open it and replace YOUR_PASSWORD_HERE with your real PostgreSQL password.
notepad .env
```

Your `.env` should look like:

```
DATABASE_URL=postgresql://postgres:MyRealPassword@localhost:5432/sih_energy
NODE_API_URL=http://localhost:3001
```

---

## Run

```powershell
# From backend/ml/
python forecast.py
```

Or from the project root:

```powershell
python backend/ml/forecast.py
```

---

## Expected terminal output (when data is sufficient)

```
Connecting to PostgreSQL …
Connected.

energy_readings (total_load) rows : 11
weather_data rows                 : 8

Merged rows (load ⨝ weather)     : 11

Features used (12): sin_hour, cos_hour, sin_dow, cos_dow, sin_doy, cos_doy,
                    temperature, wind_speed, solar_irradiance, cloud_cover,
                    humidity, pressure_hpa

Posting forecasts to http://localhost:3001/api/forecast/results …
  [1h]  ✓ inserted — id=9
  [6h]  ✓ inserted — id=10
  [24h] ✓ inserted — id=11
  [7d]  ✓ inserted — id=12

──────────────────────────────────────────────────
  SIH-2026 Ridge Regression Forecast — Summary
──────────────────────────────────────────────────
  Model              : Ridge Regression (alpha=1.0)
  Training rows      : 9
  Test rows          : 2
  Features           : 12
──────────────────────────────────────────────────
  MAE                :    152.340 kW
  RMSE               :    178.920 kW
  R²                 :     0.6812
──────────────────────────────────────────────────
  Forecasts (demand in kW):
    1h    →    2847.500 kW   [✓ sent]
    6h    →    2913.200 kW   [✓ sent]
    24h   →    2881.750 kW   [✓ sent]
    7d    →    2896.300 kW   [✓ sent]
──────────────────────────────────────────────────

Done. Forecasts are now live in forecast_results table.
Verify with:
  curl http://localhost:3001/api/forecast/all
```

> **Note on metrics with seed data**: The seed data contains ~11 load rows and
> ~8 weather rows. With this few samples the Ridge model trains and runs, but
> MAE/RMSE/R² values will not be production-meaningful. Connect a real IoT
> data pipeline to get ≥ 30 rows for reliable metrics.

---

## When data is insufficient

If fewer than 8 merged rows are available the script **stops immediately**
and prints a clear message — it does NOT generate fake predictions.

```
STOP: Only 3 merged row(s) available.
      At least 8 are required to train a meaningful Ridge model.
      ...
```

---

## How predictions reach the frontend

```
forecast.py
   └── POST /api/forecast/results   (Node.js — forecastController.ts)
           └── INSERT INTO forecast_results (PostgreSQL)
                   └── GET /api/forecast?horizon=24h  (Node.js)
                           └── React frontend (useForecast hook)
```

The frontend's `forecastData.ts` mock is **not modified** — it remains the
fallback when the API returns no data.

---

## Verify the results in the database

```powershell
psql -U postgres -d sih_energy -c "SELECT id, forecast_horizon, predicted_demand_kw, confidence_level, timestamp FROM forecast_results ORDER BY timestamp DESC LIMIT 8;"
```

---

## Features used by the Ridge model

| Feature | Source |
|---|---|
| `sin_hour`, `cos_hour` | Hour-of-day (cyclic encoding) |
| `sin_dow`, `cos_dow` | Day-of-week (cyclic encoding) |
| `sin_doy`, `cos_doy` | Day-of-year / seasonality (cyclic encoding) |
| `temperature` | `weather_data.temperature` (°C) |
| `wind_speed` | `weather_data.wind_speed` (m/s) |
| `solar_irradiance` | `weather_data.solar_irradiance` (W/m²) |
| `cloud_cover` | `weather_data.cloud_cover` (%) |
| `humidity` | `weather_data.humidity` (%) |
| `pressure_hpa` | `weather_data.pressure_hpa` (hPa) |

Missing weather values are imputed with the column mean from the training set.
