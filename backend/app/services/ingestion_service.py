from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.device import Device, DeviceStatus
from app.models.sensor import Sensor
from app.models.sensor_reading import SensorReading
from app.services.threshold_service import check_thresholds


class DeviceNotFoundError(Exception):
    pass


def process_reading(
    db: Session,
    device_string_id: str,
    sensor_type: str,
    value: float,
    unit: Optional[str] = None,
    timestamp: Optional[datetime] = None,
) -> dict:
    """Core shared ingestion pipeline used by both REST and MQTT entrypoints.

    Stores the reading, updates device last_seen/status, checks thresholds,
    and returns a dict payload suitable for broadcasting over WebSocket.
    """
    device = db.query(Device).filter(Device.device_id == device_string_id).first()
    if device is None:
        raise DeviceNotFoundError(f"Unknown device_id: {device_string_id}")

    ts = timestamp or datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    sensor = (
        db.query(Sensor)
        .filter(Sensor.device_id == device.id, Sensor.sensor_type == sensor_type)
        .first()
    )

    reading = SensorReading(
        device_id=device.id,
        sensor_id=sensor.id if sensor else None,
        sensor_type=sensor_type,
        value=value,
        unit=unit or (sensor.unit if sensor else None),
        timestamp=ts,
    )
    db.add(reading)

    device.last_seen = datetime.now(timezone.utc)
    device.status = DeviceStatus.online
    db.add(device)
    db.commit()
    db.refresh(reading)

    alert = check_thresholds(db, device, sensor_type, value)

    payload = {
        "type": "reading",
        "device_id": device.device_id,
        "sensor_type": sensor_type,
        "value": value,
        "unit": reading.unit,
        "timestamp": reading.timestamp.isoformat(),
    }
    if alert is not None:
        payload["alert"] = {
            "id": str(alert.id),
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "message": alert.message,
        }
    return payload
