"""Demo IoT device simulator.

Periodically generates realistic sensor readings for the demo devices and
sends them through the same REST API pipeline used by real devices. This
allows the full system to be demonstrated without physical hardware.

Run with: python -m scripts.simulator
Configure via SIMULATOR_ENABLED / SIMULATOR_INTERVAL_SECONDS env vars.
"""
import sys
import os
import time
import random
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simulator")

API_BASE = os.environ.get("SIMULATOR_API_BASE", "http://backend:8000")

DEVICES = ["ESP32-001", "ESP32-002", "ESP32-003"]

SENSOR_RANGES = {
    "temperature": {"base": 24.0, "drift": 3.0, "unit": "°C"},
    "humidity": {"base": 55.0, "drift": 10.0, "unit": "%"},
    "air_quality": {"base": 45.0, "drift": 20.0, "unit": "AQI"},
    "light_intensity": {"base": 400.0, "drift": 150.0, "unit": "lux"},
}

# Occasionally push a value out of range to demonstrate the alert system.
ANOMALY_CHANCE = 0.05


def generate_value(sensor_type: str) -> float:
    cfg = SENSOR_RANGES[sensor_type]
    value = cfg["base"] + random.uniform(-cfg["drift"], cfg["drift"])
    if random.random() < ANOMALY_CHANCE:
        value += cfg["drift"] * random.choice([2.5, -2.5])
    return round(value, 2)


def send_reading(device_id: str, sensor_type: str, value: float, unit: str):
    payload = {
        "device_id": device_id,
        "sensor_type": sensor_type,
        "value": value,
        "unit": unit,
    }
    try:
        resp = requests.post(f"{API_BASE}/api/readings", json=payload, timeout=5)
        if resp.status_code >= 300:
            logger.warning(f"Failed to send reading for {device_id}/{sensor_type}: {resp.status_code} {resp.text}")
    except requests.RequestException as e:
        logger.warning(f"Could not reach backend: {e}")


def run():
    interval = float(os.environ.get("SIMULATOR_INTERVAL_SECONDS", settings.SIMULATOR_INTERVAL_SECONDS))
    logger.info(f"Starting simulator, interval={interval}s, devices={DEVICES}")
    while True:
        for device_id in DEVICES:
            for sensor_type in SENSOR_RANGES:
                value = generate_value(sensor_type)
                send_reading(device_id, sensor_type, value, SENSOR_RANGES[sensor_type]["unit"])
        time.sleep(interval)


if __name__ == "__main__":
    if os.environ.get("SIMULATOR_ENABLED", "true").lower() != "true":
        logger.info("Simulator disabled via SIMULATOR_ENABLED=false")
    else:
        run()
