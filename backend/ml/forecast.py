"""
SIH-2026 — Polar Energy Management System
Python ML Forecasting Script: Ridge Regression demand forecast

Pipeline
--------
1. Connect to PostgreSQL (DATABASE_URL from .env)
2. Pull historical data:
     energy_readings  (source = 'total_load')  → target (kW)
     weather_data                               → features
3. Merge on nearest timestamp (pd.merge_asof)
4. Feature-engineer: time cyclical encodings + weather columns
5. Train Ridge Regression  (scikit-learn)
6. Evaluate: MAE, RMSE, R²
7. Produce forecasts: 1h, 6h, 24h, 7d ahead
8. POST each result to POST /api/forecast/results
9. Print a clear terminal summary

Hard rules (from project brief)
--------------------------------
- No fake data, no Math.sin(), no random predictions.
- If training data < MIN_ROWS, STOP and report clearly.
- Credentials only from .env — never hardcoded.
- Do NOT modify schema, forecastData.ts, or forecastController.ts.
"""

from __future__ import annotations

import os
import sys
import math
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import psycopg2
import requests
from dotenv import load_dotenv
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ─── Configuration ────────────────────────────────────────────────────────────

# Minimum merged rows required before we will attempt to train.
# With fewer rows the model would be meaningless.
MIN_ROWS = 8

# Forecast horizons: label → offset in hours from NOW
HORIZONS: dict[str, float] = {
    "1h":  1.0,
    "6h":  6.0,
    "24h": 24.0,
    "7d":  168.0,
}

# Confidence levels that match the DB constraint (HIGH / MEDIUM / LOW)
HORIZON_CONFIDENCE: dict[str, str] = {
    "1h":  "HIGH",
    "6h":  "HIGH",
    "24h": "MEDIUM",
    "7d":  "LOW",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _sin_cos(value: float, period: float) -> tuple[float, float]:
    """Encode a cyclic value (e.g. hour-of-day) as sin/cos pair."""
    angle = 2.0 * math.pi * value / period
    return math.sin(angle), math.cos(angle)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Construct the feature matrix from a merged DataFrame.

    Columns expected (all NaN-safe):
        timestamp (datetime), temperature, wind_speed, solar_irradiance,
        cloud_cover, humidity, pressure_hpa
    """
    ts = pd.to_datetime(df["timestamp"], utc=True)

    hour = ts.dt.hour.astype(float)
    dow  = ts.dt.dayofweek.astype(float)   # Monday=0 … Sunday=6
    doy  = ts.dt.dayofyear.astype(float)

    sin_h, cos_h = zip(*[_sin_cos(h, 24.0) for h in hour])
    sin_d, cos_d = zip(*[_sin_cos(d, 7.0)  for d in dow])
    sin_y, cos_y = zip(*[_sin_cos(y, 365.0) for y in doy])

    weather_cols = [
        "temperature", "wind_speed", "solar_irradiance",
        "cloud_cover", "humidity", "pressure_hpa",
    ]

    feat = pd.DataFrame({
        "sin_hour":         list(sin_h),
        "cos_hour":         list(cos_h),
        "sin_dow":          list(sin_d),
        "cos_dow":          list(cos_d),
        "sin_doy":          list(sin_y),
        "cos_doy":          list(cos_y),
    }, index=df.index)

    for col in weather_cols:
        if col in df.columns:
            feat[col] = pd.to_numeric(df[col], errors="coerce")
        else:
            feat[col] = np.nan

    return feat


def features_for_future(target_dt: datetime, last_weather: pd.Series) -> pd.DataFrame:
    """
    Build a single-row feature DataFrame for a future timestamp.

    Uses cyclic time encoding for the target datetime and the last known
    weather snapshot (no future weather available).
    """
    ts = pd.Series([target_dt])
    hour = float(ts.dt.hour.iloc[0])
    dow  = float(ts.dt.dayofweek.iloc[0])
    doy  = float(ts.dt.dayofyear.iloc[0])

    sh, ch = _sin_cos(hour, 24.0)
    sd, cd = _sin_cos(dow, 7.0)
    sy, cy = _sin_cos(doy, 365.0)

    row = {
        "sin_hour": sh, "cos_hour": ch,
        "sin_dow":  sd, "cos_dow":  cd,
        "sin_doy":  sy, "cos_doy":  cy,
        "temperature":       last_weather.get("temperature",      np.nan),
        "wind_speed":        last_weather.get("wind_speed",       np.nan),
        "solar_irradiance":  last_weather.get("solar_irradiance", np.nan),
        "cloud_cover":       last_weather.get("cloud_cover",      np.nan),
        "humidity":          last_weather.get("humidity",         np.nan),
        "pressure_hpa":      last_weather.get("pressure_hpa",     np.nan),
    }
    return pd.DataFrame([row])


# ─── Database queries ─────────────────────────────────────────────────────────

LOAD_QUERY = """
SELECT timestamp, power_kw AS demand_kw
FROM   energy_readings
WHERE  source = 'total_load'
ORDER  BY timestamp ASC;
"""

WEATHER_QUERY = """
SELECT timestamp, temperature, wind_speed, solar_irradiance,
       cloud_cover, humidity, pressure_hpa
FROM   weather_data
ORDER  BY timestamp ASC;
"""


def fetch_data(conn) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (load_df, weather_df) from the live PostgreSQL database."""
    load_df    = pd.read_sql(LOAD_QUERY,    conn, parse_dates=["timestamp"])
    weather_df = pd.read_sql(WEATHER_QUERY, conn, parse_dates=["timestamp"])
    return load_df, weather_df


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:

    # ── 1. Load environment ──────────────────────────────────────────────────
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path=env_path)

    database_url = os.getenv("DATABASE_URL", "")
    node_api_url = os.getenv("NODE_API_URL", "http://localhost:3001").rstrip("/")

    if not database_url or "YOUR_PASSWORD_HERE" in database_url:
        print("ERROR: DATABASE_URL is not configured.")
        print("       Edit backend/ml/.env and replace YOUR_PASSWORD_HERE with your")
        print("       actual PostgreSQL password, then run again.")
        sys.exit(1)

    # ── 2. Connect to PostgreSQL ─────────────────────────────────────────────
    print("Connecting to PostgreSQL …")
    try:
        conn = psycopg2.connect(database_url)
    except psycopg2.OperationalError as exc:
        print(f"ERROR: Could not connect to PostgreSQL.\n  {exc}")
        print("       Check that PostgreSQL is running and DATABASE_URL is correct.")
        sys.exit(1)

    print("Connected.\n")

    # ── 3. Fetch historical data ─────────────────────────────────────────────
    try:
        load_df, weather_df = fetch_data(conn)
    finally:
        conn.close()

    print(f"energy_readings (total_load) rows : {len(load_df)}")
    print(f"weather_data rows                 : {len(weather_df)}\n")

    if load_df.empty:
        print(
            "STOP: energy_readings contains NO rows with source = 'total_load'.\n"
            "      Run backend/seed.sql first:\n"
            "        psql -U postgres -d sih_energy -f backend/seed.sql\n"
            "      Then re-run this script."
        )
        sys.exit(1)

    # ── 4. Merge on nearest timestamp (asof join) ────────────────────────────
    # Ensure both series are tz-aware UTC for safe comparison
    load_df["timestamp"] = pd.to_datetime(load_df["timestamp"], utc=True)
    load_df = load_df.sort_values("timestamp").reset_index(drop=True)

    if not weather_df.empty:
        weather_df["timestamp"] = pd.to_datetime(weather_df["timestamp"], utc=True)
        weather_df = weather_df.sort_values("timestamp").reset_index(drop=True)

        # Merge each load reading with the nearest preceding weather snapshot
        merged = pd.merge_asof(
            load_df,
            weather_df,
            on="timestamp",
            direction="nearest",
            tolerance=pd.Timedelta("4h"),  # accept weather within ±4 h
        )
    else:
        print(
            "WARNING: weather_data table is empty. "
            "Weather features will be NaN (Ridge will still train on time features)."
        )
        merged = load_df.copy()

    print(f"Merged rows (load ⨝ weather)     : {len(merged)}\n")

    if len(merged) < MIN_ROWS:
        print(
            f"STOP: Only {len(merged)} merged row(s) available.\n"
            f"      At least {MIN_ROWS} are required to train a meaningful Ridge model.\n\n"
            "      The seed data has a small number of snapshots which is intentional\n"
            "      for a prototype. To enable real ML training, ingest more historical\n"
            "      data into energy_readings and weather_data (>= 30 rows recommended).\n\n"
            "      Recommended next step:\n"
            "        Insert more rows into energy_readings (source='total_load') and\n"
            "        weather_data via your IoT pipeline, then re-run this script."
        )
        sys.exit(1)

    # ── 5. Build feature matrix & target ────────────────────────────────────
    X_raw = build_features(merged)
    y     = pd.to_numeric(merged["demand_kw"], errors="coerce")

    # Drop rows where the target is NaN
    valid_mask = y.notna()
    X_raw = X_raw[valid_mask].reset_index(drop=True)
    y     = y[valid_mask].reset_index(drop=True)
    merged_valid = merged[valid_mask].reset_index(drop=True)

    # Impute any remaining NaN feature values with column means
    col_means = X_raw.mean()
    X_raw = X_raw.fillna(col_means)

    feature_names = list(X_raw.columns)
    print(f"Features used ({len(feature_names)}): {', '.join(feature_names)}\n")

    if len(y) < MIN_ROWS:
        print(
            f"STOP: After dropping NaN targets only {len(y)} rows remain.\n"
            f"      Need at least {MIN_ROWS}. Add more data and retry."
        )
        sys.exit(1)

    # ── 6. Train / test split + scaling ─────────────────────────────────────
    if len(y) >= 16:
        test_size = 0.2
    else:
        # With very few rows put only 1 sample in test so we have enough to train
        test_size = 1

    X_train, X_test, y_train, y_test = train_test_split(
        X_raw.values, y.values,
        test_size=test_size,
        random_state=42,
        shuffle=False,   # keep temporal order
    )

    scaler  = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # ── 7. Train Ridge Regression ────────────────────────────────────────────
    model = Ridge(alpha=1.0)
    model.fit(X_train_s, y_train)

    # ── 8. Evaluate ──────────────────────────────────────────────────────────
    y_pred_test = model.predict(X_test_s)

    mae  = mean_absolute_error(y_test, y_pred_test)
    rmse = math.sqrt(mean_squared_error(y_test, y_pred_test))
    r2   = r2_score(y_test, y_pred_test)

    # ── 9. Generate future forecasts ────────────────────────────────────────
    now_utc = datetime.now(timezone.utc)

    # Last known weather snapshot for feature extrapolation
    if not weather_df.empty:
        last_weather = weather_df.iloc[-1]
    else:
        last_weather = pd.Series(dtype=float)

    # Also grab col_means so imputation is consistent with training
    predictions: dict[str, float] = {}
    for label, offset_hours in HORIZONS.items():
        target_dt = now_utc + timedelta(hours=offset_hours)
        X_future  = features_for_future(target_dt, last_weather)
        X_future  = X_future[feature_names].fillna(col_means)
        X_future_s = scaler.transform(X_future.values)
        pred_kw    = float(model.predict(X_future_s)[0])
        # Guard against nonsensical negative predictions
        pred_kw    = max(pred_kw, 0.0)
        predictions[label] = round(pred_kw, 3)

    # ── 10. POST forecasts to Node.js API ───────────────────────────────────
    api_endpoint = f"{node_api_url}/api/forecast/results"
    api_results: dict[str, dict] = {}

    print(f"Posting forecasts to {api_endpoint} …")
    for label, pred_kw in predictions.items():
        payload = {
            "predicted_demand_kw": pred_kw,
            "forecast_horizon":    label,
            "confidence_level":    HORIZON_CONFIDENCE[label],
        }
        try:
            resp = requests.post(api_endpoint, json=payload, timeout=10)
            if resp.status_code == 201:
                api_results[label] = resp.json()
                print(f"  [{label}] ✓ inserted — id={api_results[label].get('id')}")
            else:
                print(f"  [{label}] ✗ HTTP {resp.status_code}: {resp.text[:200]}")
                api_results[label] = {"error": resp.text}
        except requests.exceptions.ConnectionError:
            print(f"  [{label}] ✗ Could not reach {api_endpoint}")
            print(
                "           Start the Node.js backend first:\n"
                "             cd backend && npm run dev"
            )
            api_results[label] = {"error": "connection refused"}
        except requests.exceptions.Timeout:
            print(f"  [{label}] ✗ Request timed out.")
            api_results[label] = {"error": "timeout"}

    # ── 11. Terminal summary ──────────────────────────────────────────────────
    separator = "─" * 50
    print(f"\n{separator}")
    print("  SIH-2026 Ridge Regression Forecast — Summary")
    print(separator)
    print(f"  Model              : Ridge Regression (alpha=1.0)")
    print(f"  Training rows      : {len(X_train)}")
    print(f"  Test rows          : {len(X_test)}")
    print(f"  Features           : {len(feature_names)}")
    print(separator)
    print(f"  MAE                : {mae:>10.3f} kW")
    print(f"  RMSE               : {rmse:>10.3f} kW")
    print(f"  R²                 : {r2:>10.4f}")
    print(separator)
    print("  Forecasts (demand in kW):")
    for label, pred_kw in predictions.items():
        status = "✓ sent" if "id" in api_results.get(label, {}) else "✗ not sent"
        print(f"    {label:<5}  →  {pred_kw:>10.3f} kW   [{status}]")
    print(separator)

    # Exit with error code if any POST failed
    any_failed = any("error" in v for v in api_results.values())
    if any_failed:
        print("\nWARNING: One or more forecasts were not saved to the database.")
        print("         Check that the Node.js backend is running on port 3001.")
        sys.exit(2)

    print("\nDone. Forecasts are now live in forecast_results table.")
    print(
        "Verify with:\n"
        "  curl http://localhost:3001/api/forecast/all"
    )


if __name__ == "__main__":
    main()
