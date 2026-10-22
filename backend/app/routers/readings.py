import uuid
import io
import csv
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sensor_reading import SensorReading
from app.models.device import Device
from app.models.user import User
from app.schemas.reading import ReadingCreate, ReadingOut, ReadingStats
from app.dependencies import get_current_user
from app.services.ingestion_service import process_reading, DeviceNotFoundError
from app.websocket.manager import manager

router = APIRouter(prefix="/api/readings", tags=["Readings"])


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_reading(
    payload: ReadingCreate,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None),
):
    """Ingest a sensor reading via REST. Devices authenticate with their api_key
    (X-API-Key header) rather than a user JWT, since IoT devices don't log in."""
    device = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Unknown device_id")
    if x_api_key and x_api_key != device.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")

    try:
        result = process_reading(
            db,
            device_string_id=payload.device_id,
            sensor_type=payload.sensor_type,
            value=payload.value,
            unit=payload.unit,
            timestamp=payload.timestamp,
        )
    except DeviceNotFoundError:
        raise HTTPException(status_code=404, detail="Unknown device_id")

    await manager.broadcast(result)
    return {"status": "ok", "data": result}


@router.get("", response_model=list[ReadingOut])
def list_readings(
    device_id: Optional[uuid.UUID] = None,
    sensor_type: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SensorReading)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)
    if sensor_type:
        query = query.filter(SensorReading.sensor_type == sensor_type)
    return (
        query.order_by(SensorReading.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/latest", response_model=list[ReadingOut])
def latest_readings(
    device_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the most recent reading per sensor_type (optionally per device)."""
    subq = (
        db.query(
            SensorReading.device_id,
            SensorReading.sensor_type,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .group_by(SensorReading.device_id, SensorReading.sensor_type)
    )
    if device_id:
        subq = subq.filter(SensorReading.device_id == device_id)
    subq = subq.subquery()

    query = db.query(SensorReading).join(
        subq,
        (SensorReading.device_id == subq.c.device_id)
        & (SensorReading.sensor_type == subq.c.sensor_type)
        & (SensorReading.timestamp == subq.c.max_ts),
    )
    return query.all()


TIME_RANGE_MAP = {
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


def _resolve_since(time_range: Optional[str], start: Optional[datetime]) -> Optional[datetime]:
    if start:
        return start
    if time_range and time_range in TIME_RANGE_MAP:
        return datetime.now(timezone.utc) - TIME_RANGE_MAP[time_range]
    return None


@router.get("/history", response_model=list[ReadingOut])
def reading_history(
    device_id: uuid.UUID,
    sensor_type: str,
    time_range: Optional[str] = Query(None, description="1h|6h|24h|7d|30d"),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    limit: int = Query(2000, le=10000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = _resolve_since(time_range, start)
    query = db.query(SensorReading).filter(
        SensorReading.device_id == device_id,
        SensorReading.sensor_type == sensor_type,
    )
    if since:
        query = query.filter(SensorReading.timestamp >= since)
    if end:
        query = query.filter(SensorReading.timestamp <= end)
    return query.order_by(SensorReading.timestamp.asc()).limit(limit).all()


@router.get("/history/stats", response_model=ReadingStats)
def reading_history_stats(
    device_id: uuid.UUID,
    sensor_type: str,
    time_range: Optional[str] = Query(None),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = _resolve_since(time_range, start)
    query = db.query(SensorReading).filter(
        SensorReading.device_id == device_id,
        SensorReading.sensor_type == sensor_type,
    )
    if since:
        query = query.filter(SensorReading.timestamp >= since)
    if end:
        query = query.filter(SensorReading.timestamp <= end)

    stats = query.with_entities(
        func.min(SensorReading.value),
        func.max(SensorReading.value),
        func.avg(SensorReading.value),
        func.count(SensorReading.id),
    ).first()

    return ReadingStats(
        sensor_type=sensor_type,
        min_value=stats[0],
        max_value=stats[1],
        avg_value=float(stats[2]) if stats[2] is not None else None,
        count=stats[3] or 0,
    )


@router.get("/history/export")
def export_history_csv(
    device_id: uuid.UUID,
    sensor_type: str,
    time_range: Optional[str] = Query(None),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = _resolve_since(time_range, start)
    query = db.query(SensorReading).filter(
        SensorReading.device_id == device_id,
        SensorReading.sensor_type == sensor_type,
    )
    if since:
        query = query.filter(SensorReading.timestamp >= since)
    if end:
        query = query.filter(SensorReading.timestamp <= end)
    rows = query.order_by(SensorReading.timestamp.asc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["timestamp", "device_id", "sensor_type", "value", "unit"])
    for r in rows:
        writer.writerow([r.timestamp.isoformat(), str(r.device_id), r.sensor_type, r.value, r.unit])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=readings_{sensor_type}.csv"},
    )
