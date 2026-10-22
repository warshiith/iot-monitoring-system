import json
import asyncio
import logging
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from app.config import settings
from app.database import SessionLocal
from app.services.ingestion_service import process_reading, DeviceNotFoundError
from app.websocket.manager import manager

logger = logging.getLogger("mqtt")

_event_loop: asyncio.AbstractEventLoop = None


def set_event_loop(loop: asyncio.AbstractEventLoop):
    global _event_loop
    _event_loop = loop


def _broadcast_from_thread(payload: dict):
    if _event_loop is None:
        return
    asyncio.run_coroutine_threadsafe(manager.broadcast(payload), _event_loop)


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        topic = f"{settings.MQTT_TOPIC_PREFIX}/+/readings"
        client.subscribe(topic)
        logger.info(f"MQTT connected, subscribed to {topic}")
    else:
        logger.warning(f"MQTT connection failed with code {rc}")


def _on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.warning(f"Invalid MQTT JSON payload on topic {msg.topic}")
        return

    device_id = data.get("device_id")
    sensor_type = data.get("sensor_type")
    value = data.get("value")

    if not device_id or not sensor_type or value is None:
        logger.warning(f"Missing required fields in MQTT payload: {data}")
        return

    try:
        value = float(value)
    except (TypeError, ValueError):
        logger.warning(f"Non-numeric value in MQTT payload: {data}")
        return

    timestamp = None
    if data.get("timestamp"):
        try:
            timestamp = datetime.fromisoformat(str(data["timestamp"]).replace("Z", "+00:00"))
        except ValueError:
            timestamp = None

    db = SessionLocal()
    try:
        payload = process_reading(
            db,
            device_string_id=device_id,
            sensor_type=sensor_type,
            value=value,
            unit=data.get("unit"),
            timestamp=timestamp,
        )
        _broadcast_from_thread(payload)
    except DeviceNotFoundError as e:
        logger.warning(str(e))
    except Exception as e:
        logger.error(f"Error processing MQTT reading: {e}")
    finally:
        db.close()


def create_mqtt_client() -> mqtt.Client:
    client = mqtt.Client()
    if settings.MQTT_USERNAME:
        client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
    client.on_connect = _on_connect
    client.on_message = _on_message
    return client


def start_mqtt_client() -> mqtt.Client:
    client = create_mqtt_client()
    try:
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
        client.loop_start()
        logger.info("MQTT client started")
    except Exception as e:
        logger.warning(f"Could not connect to MQTT broker: {e}")
    return client
