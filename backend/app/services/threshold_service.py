from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.alert_threshold import AlertThreshold
from app.models.alert import Alert
from app.models.device import Device


def check_thresholds(db: Session, device: Device, sensor_type: str, value: float) -> Optional[Alert]:
    """Check active thresholds for a sensor reading and create an alert if breached.

    Avoids duplicate alerts for the same unchanged abnormal state by checking
    whether the most recent alert for this device/sensor is still unacknowledged
    and of the same alert_type (i.e. state hasn't changed back to normal yet).
    """
    threshold = (
        db.query(AlertThreshold)
        .filter(
            AlertThreshold.device_id == device.id,
            AlertThreshold.sensor_type == sensor_type,
            AlertThreshold.enabled.is_(True),
        )
        .first()
    )
    if threshold is None:
        return None

    alert_type = None
    threshold_value = None
    if threshold.maximum_threshold is not None and value > threshold.maximum_threshold:
        alert_type = "HIGH"
        threshold_value = threshold.maximum_threshold
    elif threshold.minimum_threshold is not None and value < threshold.minimum_threshold:
        alert_type = "LOW"
        threshold_value = threshold.minimum_threshold

    if alert_type is None:
        return None

    # Avoid duplicate alerts for the same unchanged abnormal state:
    # if the last alert for this device+sensor is unacknowledged and same type, skip.
    last_alert = (
        db.query(Alert)
        .filter(Alert.device_id == device.id, Alert.sensor_type == sensor_type)
        .order_by(Alert.created_at.desc())
        .first()
    )
    if last_alert and not last_alert.is_acknowledged and last_alert.alert_type == alert_type:
        return None

    message = (
        f"{sensor_type.capitalize()} {alert_type.lower()} alert on device "
        f"{device.device_id}: value={value} threshold={threshold_value}"
    )
    alert = Alert(
        device_id=device.id,
        sensor_type=sensor_type,
        sensor_value=value,
        threshold_value=threshold_value,
        alert_type=alert_type,
        severity=threshold.severity,
        message=message,
        is_acknowledged=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
