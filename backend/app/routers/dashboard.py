from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.device import Device, DeviceStatus
from app.models.alert import Alert
from app.models.sensor_reading import SensorReading
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, LatestSensorValue
from app.dependencies import get_current_user
from app.services.device_status_service import refresh_device_statuses

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    refresh_device_statuses(db)

    total_devices = db.query(Device).count()
    online_devices = db.query(Device).filter(Device.status == DeviceStatus.online).count()
    offline_devices = total_devices - online_devices
    active_alerts = db.query(Alert).filter(Alert.is_acknowledged.is_(False)).count()

    subq = (
        db.query(
            SensorReading.sensor_type,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .group_by(SensorReading.sensor_type)
        .subquery()
    )
    latest_rows = (
        db.query(SensorReading)
        .join(subq, (SensorReading.sensor_type == subq.c.sensor_type) & (SensorReading.timestamp == subq.c.max_ts))
        .all()
    )

    latest_values = [
        LatestSensorValue(
            sensor_type=r.sensor_type,
            value=r.value,
            unit=r.unit,
            device_id=str(r.device_id),
            timestamp=r.timestamp.isoformat(),
        )
        for r in latest_rows
    ]

    return DashboardSummary(
        total_devices=total_devices,
        online_devices=online_devices,
        offline_devices=offline_devices,
        active_alerts=active_alerts,
        latest_values=latest_values,
    )
