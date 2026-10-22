from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.device import Device, DeviceStatus
from app.config import settings


def refresh_device_statuses(db: Session) -> None:
    """Mark devices offline if last_seen exceeds the configured timeout."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.DEVICE_OFFLINE_TIMEOUT_SECONDS)
    devices = db.query(Device).filter(Device.status != DeviceStatus.offline).all()
    changed = False
    for device in devices:
        last_seen = device.last_seen
        if last_seen is not None and last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        if last_seen is None or last_seen < cutoff:
            device.status = DeviceStatus.offline
            changed = True
    if changed:
        db.commit()
