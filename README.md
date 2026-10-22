# Pulsegrid — Real-Time IoT Data Logging and Visualization System

## Abstract

Pulsegrid is a centralized, full-stack platform for collecting, storing,
monitoring, and analyzing environmental IoT sensor data in real time. It
ingests readings from devices over REST or MQTT, persists them in
PostgreSQL, streams live updates to a React dashboard over WebSockets,
evaluates configurable thresholds to raise alerts, and provides historical
trend analysis with CSV export. The system is fully containerized with
Docker Compose and ships with a demo device simulator, so it can be
demonstrated end-to-end without physical hardware.

## Problem Statement

Environmental and industrial processes (greenhouses, server rooms, smart
homes, labs) generate continuous streams of sensor data — temperature,
humidity, air quality, light — that need to be centrally collected,
persisted, visualized, and monitored for out-of-range conditions. Ad-hoc
scripts and spreadsheets don't scale, don't provide real-time visibility,
and don't alert anyone when something goes wrong. Pulsegrid solves this
with a single, affordable, three-tier web application.

## Objectives

- Provide a single ingestion pipeline that accepts readings via **REST**
  and **MQTT**.
- Persist all readings in **PostgreSQL**, optimized for time-based queries.
- Push new readings to connected clients in **real time** via WebSockets.
- Visualize live and historical data with **interactive charts**.
- Detect threshold breaches and raise **alerts** without spamming
  duplicates for an unchanged abnormal state.
- Manage devices and sensors through an authenticated **admin UI**.
- Secure the system with **JWT authentication** and **role-based access**.
- Ship as a **Dockerized**, one-command deployment suitable for a college
  mini-project demo as well as small real deployments.

## Features

- Temperature, humidity, air-quality, light-intensity, and custom sensor
  support
- REST (`POST /api/readings`) and MQTT (`iot/devices/+/readings`) ingestion
  sharing one validation → storage → threshold → broadcast pipeline
- Live dashboard with device counts, active alerts, latest values, and a
  live event feed (WebSocket, auto-reconnect with backoff, visible
  connection status)
- Interactive line/area charts with selectable time ranges (1h, 6h, 24h,
  7d, 30d), min/max/avg statistics, and CSV export
- Device management (create/edit/delete, per-device API key, online /
  offline / warning status derived from `last_seen`)
- Sensor configuration per device (type, unit, expected range)
- Threshold-based alerting with HIGH/LOW detection, severity levels, and
  acknowledgement workflow
- JWT authentication with bcrypt password hashing; first registered user
  becomes `admin`, everyone else is `user`; device-management endpoints are
  admin-only
- Demo simulator that generates realistic readings (with occasional
  anomalies to trigger alerts) through the same REST pipeline real devices
  use
- Dockerized: PostgreSQL, Mosquitto MQTT broker, FastAPI backend, React
  frontend, and the simulator all start with one command
- Automated tests: 22 backend pytest tests, 8 frontend Vitest/RTL tests

## Architecture

```
IoT Sensor / ESP32 / Simulator
        │
        ├── REST  → POST /api/readings ─┐
        └── MQTT  → iot/devices/+/readings ─┤
                                             ▼
                                  FastAPI Backend
                                  (validation, auth)
                                             │
                                             ▼
                                  Threshold Engine
                                    │            │
                                    ▼            ▼
                              PostgreSQL     Alert Database
                                    │            │
                                    ▼            ▼
                              WebSocket / SSE Broadcast
                                             │
                                             ▼
                                    React Dashboard
```

Three-tier design: **Frontend (React/Vite)** → **Backend API (FastAPI)** →
**Database (PostgreSQL)**, with MQTT as a parallel ingestion path into the
same backend.

## Technology Stack

**Frontend:** React 18, Vite, JavaScript, Tailwind CSS, Recharts, Axios,
React Router

**Backend:** Python, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic,
python-jose (JWT), passlib/bcrypt, paho-mqtt

**Database:** PostgreSQL 16

**Real-time:** MQTT (Mosquitto) for devices, native WebSockets for
dashboard push updates

**DevOps:** Docker, Docker Compose

**Testing:** Pytest + httpx (backend), Vitest + React Testing Library
(frontend)

## Folder Structure

```
iot-monitoring-system/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, lifespan, router wiring
│   │   ├── config.py               # Settings from environment variables
│   │   ├── database.py             # SQLAlchemy engine/session
│   │   ├── dependencies.py         # get_current_user / get_current_admin
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── routers/                 # auth, devices, sensors, readings,
│   │   │                            #   alerts, dashboard, health, websocket
│   │   ├── services/                # ingestion, threshold, device-status
│   │   ├── mqtt/                    # paho-mqtt client + handlers
│   │   ├── auth/                    # password hashing, JWT
│   │   └── websocket/                # connection manager
│   ├── scripts/
│   │   ├── seed.py                  # demo admin/user, devices, sensors
│   │   └── simulator.py             # demo reading generator
│   ├── alembic/                     # migrations
│   ├── tests/                       # pytest suite (22 tests)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-entrypoint.sh         # wait-for-db → migrate → seed → run
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/              # shared UI (badges, toasts, dialogs…)
│   │   ├── pages/                   # Login, Register, Dashboard, Devices,
│   │   │                            #   DeviceDetails, Sensors,
│   │   │                            #   LiveMonitoring, HistoricalData,
│   │   │                            #   Alerts, Settings
│   │   ├── layouts/AppLayout.jsx    # sidebar + topbar shell
│   │   ├── services/                 # axios API clients
│   │   ├── hooks/useLiveReadings.js  # WebSocket hook w/ reconnect
│   │   ├── context/AuthContext.jsx
│   │   ├── charts/                   # Recharts line/area chart wrappers
│   │   └── __tests__/                # Vitest + RTL tests (8 tests)
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── mqtt/configuration/mosquitto.conf
├── database/init/01-init.sql
├── docker-compose.yml
├── .env.example
└── README.md
```

## Database Design

| Table              | Purpose                                              |
|--------------------|-------------------------------------------------------|
| `users`            | Accounts, bcrypt password hash, `role` (admin/user)   |
| `devices`          | Registered IoT devices, `status`, per-device `api_key`|
| `sensors`          | Sensor definitions attached to a device               |
| `sensor_readings`  | Time-series readings; indexed on device/sensor/type/timestamp |
| `alert_thresholds` | Configurable min/max per device + sensor type         |
| `alerts`           | Generated alert records with acknowledgement state    |

Indexes: `sensor_readings` has individual indexes on `device_id`,
`sensor_id`, `sensor_type`, `timestamp`, plus a composite
`(device_id, sensor_type, timestamp)` index for the historical-query
endpoints. Foreign keys cascade (`devices → sensors → sensor_readings`) so
deleting a device cleans up its data.

## API Documentation

Interactive OpenAPI/Swagger docs are always available at **`/docs`** once
the backend is running (e.g. `http://localhost:8000/docs`).

**Authentication**
```
POST /api/auth/register      { name, email, password }
POST /api/auth/login         { email, password }
GET  /api/auth/me            (JWT required)
```

**Devices** (JWT required; write ops admin-only)
```
GET    /api/devices
POST   /api/devices
GET    /api/devices/{id}
PUT    /api/devices/{id}
DELETE /api/devices/{id}
```

**Sensors** (JWT required; write ops admin-only)
```
GET    /api/sensors?device_id=
POST   /api/sensors
PUT    /api/sensors/{id}
DELETE /api/sensors/{id}
```

**Readings**
```
POST /api/readings                        # device ingestion (X-API-Key optional)
GET  /api/readings?device_id=&sensor_type=&limit=&offset=
GET  /api/readings/latest?device_id=
GET  /api/readings/history?device_id=&sensor_type=&time_range=24h
GET  /api/readings/history/stats?device_id=&sensor_type=&time_range=24h
GET  /api/readings/history/export?device_id=&sensor_type=&time_range=24h   # CSV
```

**Alerts & Thresholds**
```
GET  /api/alerts?device_id=&is_acknowledged=
PUT  /api/alerts/{id}/acknowledge
GET  /api/thresholds?device_id=
POST /api/thresholds
PUT  /api/thresholds/{id}
DELETE /api/thresholds/{id}
```

**Dashboard / Health**
```
GET /api/dashboard/summary
GET /health
```

**WebSocket**
```
WS /ws/readings     # broadcasts { type: "reading", device_id, sensor_type, value, unit, timestamp, alert? }
```

## MQTT Topic Structure

Devices publish JSON to:

```
iot/devices/<device_id>/readings
```

Example payload:
```json
{
  "device_id": "ESP32-001",
  "sensor_type": "temperature",
  "value": 28.5,
  "unit": "°C",
  "timestamp": "2026-08-23T12:00:00Z"
}
```

The backend subscribes to the wildcard `iot/devices/+/readings`, validates
each message, stores it, updates the device's `last_seen`/status, runs
threshold checks, and broadcasts the result to WebSocket clients — the
same pipeline used by the REST endpoint.

## Installation (from a fresh machine)

### Option A — Docker Compose (recommended)

1. Install [Docker](https://docs.docker.com/get-docker/) and Docker
   Compose (bundled with Docker Desktop).
2. Clone/copy this project, then from the project root:
   ```bash
   cp .env.example .env
   docker compose up --build
   ```
3. Wait for the backend healthcheck to pass — it automatically waits for
   PostgreSQL, runs Alembic migrations, and seeds demo data.
4. Open:
   - Frontend: http://localhost:5173
   - Backend API docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

### Option B — Run services locally without Docker

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL to point at your local Postgres
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```
You'll also need a local PostgreSQL instance and (optionally) a local
Mosquitto broker for MQTT ingestion — REST ingestion works without MQTT.

**Simulator** (in a second terminal, from `backend/`)
```bash
SIMULATOR_API_BASE=http://localhost:8000 python -m scripts.simulator
```

**Frontend** (in a third terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Configuration

All variables are documented in `.env.example` (root) and the per-service
`.env.example` files. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string for PostgreSQL |
| `JWT_SECRET_KEY` | Secret used to sign JWTs — **change in production** |
| `MQTT_BROKER_HOST` / `MQTT_BROKER_PORT` | Where the backend connects for MQTT |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `DEVICE_OFFLINE_TIMEOUT_SECONDS` | How long without a reading before a device is marked offline |
| `SIMULATOR_ENABLED` / `SIMULATOR_INTERVAL_SECONDS` | Demo simulator behavior |
| `VITE_API_BASE_URL` / `VITE_WS_URL` | Frontend build-time API/WebSocket targets |

Secrets are never hard-coded; the backend reads them via
`pydantic-settings`, and the frontend never embeds credentials — only the
public API base URL.

## Demo / Simulation Mode

Because a physical ESP32 may not be available during a review, the
`simulator` service (started automatically by `docker compose up`) sends
realistic temperature/humidity/air-quality/light readings for three demo
devices (`ESP32-001/002/003`) through the same `POST /api/readings`
endpoint real hardware would use, on a configurable interval. It
occasionally pushes an out-of-range value so you can show the alert
pipeline live.

## Demo Credentials

Seeded automatically on first startup:

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@iot.local   | Admin@123 |
| User  | user@iot.local    | User@123  |

## Testing

**Backend** (from `backend/`, with dependencies installed):
```bash
pytest -q
```
Covers: registration, login, JWT auth, unauthorized access, device
CRUD, reading ingestion + validation, threshold detection (including
duplicate-alert suppression), alert acknowledgement, and dashboard
summary. 22 tests, SQLite in-memory-style test database.

**Frontend** (from `frontend/`):
```bash
npm test
```
Covers login flow/token storage, dashboard rendering with mocked data,
and shared UI components (status badges, connection indicator).

**End-to-end flow** exercised across the test suites: register/login →
create device → configure threshold → submit reading → alert generated →
alert visible via `GET /api/alerts` → acknowledge alert. The Dashboard
frontend test additionally verifies the same device/summary data renders
correctly in the UI.

## How to Demonstrate the Project During a College Review / Viva

1. `docker compose up --build` — show all five containers starting
   (Postgres, Mosquitto, backend, simulator, frontend).
2. Open `http://localhost:8000/docs` — walk through the auto-generated
   Swagger UI, show the endpoint list matches the API design.
3. Open `http://localhost:5173`, log in with the seeded admin account.
4. **Dashboard** — point out live counts and the "Live feed" panel
   updating as the simulator sends data (no refresh needed).
5. **Devices** — show the three seeded demo devices, their ONLINE status,
   and create a new device live to demonstrate the admin-only form and
   per-device API key.
6. **Live Monitoring** — show per-device sensor tiles flashing as new
   values arrive over WebSocket; toggle the connection status indicator
   by stopping the backend briefly to show "Reconnecting…".
7. **Historical Data** — pick a device/sensor, switch between 1h/24h/7d
   ranges, show the chart and stats update, then click "Export CSV".
8. **Alerts** — wait for (or manually POST) an out-of-range reading and
   show the alert appear in real time; acknowledge it. Switch to the
   **Thresholds** tab to show the configurable min/max per sensor.
9. Kill the `db` container to show the `/health` endpoint and frontend
   error handling degrade gracefully, then restart it to show recovery.
10. Run `pytest -q` and `npm test` live to show the automated test suites
    passing.

## Implemented Features Mapped to Project Objectives

| Objective (from project brief) | Status | Where |
|---|---|---|
| Centralized real-time IoT data collection | ✅ | `POST /api/readings`, MQTT subscriber, shared `ingestion_service.py` |
| Environmental sensor monitoring (temp/humidity/air/light + custom) | ✅ | `sensors` model, seed data, Live Monitoring page |
| REST/MQTT communication | ✅ | `routers/readings.py`, `mqtt/client.py` |
| PostgreSQL storage | ✅ | SQLAlchemy models + Alembic migration `0001_initial_schema.py` |
| Interactive visualization | ✅ | Recharts line/area charts, Dashboard, Live Monitoring |
| Historical trend analysis | ✅ | `/api/readings/history`, `/history/stats`, Historical Data page, CSV export |
| Threshold-based alerts | ✅ | `services/threshold_service.py`, `alert_thresholds`/`alerts` tables, Alerts page |
| Device management | ✅ | `routers/devices.py`, Devices + Device Details pages |
| JWT authentication | ✅ | `auth/security.py`, `dependencies.py`, role-based admin checks |
| Scalable three-tier architecture | ✅ | React → FastAPI → PostgreSQL, MQTT as parallel ingress |
| Docker deployment | ✅ | `docker-compose.yml`, per-service Dockerfiles, one-command startup |

## Future Enhancements

- Server-Sent Events fallback for environments where WebSockets are
  blocked
- Per-user notification preferences (email/SMS on alert)
- Multi-tenant device ownership and sharing
- Rate limiting middleware (e.g. slowapi) on ingestion endpoints
- Rolling data retention / downsampling for long-term historical storage
- TLS + authenticated MQTT for production deployments

## Screenshots

_Add screenshots here after running the app locally:_

- `docs/screenshots/dashboard.png`
- `docs/screenshots/live-monitoring.png`
- `docs/screenshots/historical-data.png`
- `docs/screenshots/alerts.png`
- `docs/screenshots/devices.png`
