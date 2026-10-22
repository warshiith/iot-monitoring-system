import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.sensor import Sensor
from app.models.device import Device
from app.models.user import User
from app.schemas.sensor import SensorCreate, SensorUpdate, SensorOut
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])


@router.get("", response_model=list[SensorOut])
def list_sensors(
    device_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Sensor)
    if device_id:
        query = query.filter(Sensor.device_id == device_id)
    return query.order_by(Sensor.created_at.desc()).all()


@router.post("", response_model=SensorOut, status_code=status.HTTP_201_CREATED)
def create_sensor(
    payload: SensorCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    device = db.query(Device).filter(Device.id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    existing = (
        db.query(Sensor)
        .filter(Sensor.device_id == payload.device_id, Sensor.sensor_type == payload.sensor_type)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Sensor of this type already exists for device")
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.put("/{sensor_id}", response_model=SensorOut)
def update_sensor(
    sensor_id: uuid.UUID,
    payload: SensorUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sensor, field, value)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sensor(
    sensor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    db.delete(sensor)
    db.commit()
    return None
