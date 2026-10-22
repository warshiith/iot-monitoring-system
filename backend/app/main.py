import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import auth, devices, sensors, readings, alerts, dashboard, health, websocket_router
from app.mqtt.client import start_mqtt_client, set_event_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

Base.metadata.create_all(bind=engine)

mqtt_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global mqtt_client
    loop = asyncio.get_event_loop()
    set_event_loop(loop)
    mqtt_client = start_mqtt_client()
    yield
    if mqtt_client is not None:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()


app = FastAPI(
    title="Real-Time IoT Data Logging and Visualization System",
    description=(
        "A centralized platform for collecting, storing, monitoring, and analyzing "
        "IoT sensor data in real time via REST and MQTT, with live dashboards, "
        "historical analysis, and threshold-based alerting."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(sensors.router)
app.include_router(readings.router)
app.include_router(alerts.router)
app.include_router(alerts.threshold_router)
app.include_router(dashboard.router)
app.include_router(websocket_router.router)


@app.get("/")
def root():
    return {
        "message": "Real-Time IoT Data Logging and Visualization System API",
        "docs": "/docs",
    }
