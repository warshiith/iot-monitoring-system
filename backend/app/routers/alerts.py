import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import Alert
from app.models.alert_threshold import AlertThreshold
from app.models.user import User
from app.schemas.alert import (
    AlertOut, AlertThresholdCreate, AlertThresholdUpdate, AlertThresholdOut,
)
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(
    device_id: Optional[uuid.UUID] = None,
    is_acknowledged: Optional[bool] = None,
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert)
    if device_id:
        query = query.filter(Alert.device_id == device_id)
    if is_acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == is_acknowledged)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.put("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_acknowledged = True
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


threshold_router = APIRouter(prefix="/api/thresholds", tags=["Alert Thresholds"])


@threshold_router.get("", response_model=list[AlertThresholdOut])
def list_thresholds(
    device_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AlertThreshold)
    if device_id:
        query = query.filter(AlertThreshold.device_id == device_id)
    return query.all()


@threshold_router.post("", response_model=AlertThresholdOut, status_code=status.HTTP_201_CREATED)
def create_threshold(
    payload: AlertThresholdCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if payload.minimum_threshold is not None and payload.maximum_threshold is not None:
        if payload.minimum_threshold >= payload.maximum_threshold:
            raise HTTPException(status_code=400, detail="minimum_threshold must be less than maximum_threshold")
    threshold = AlertThreshold(**payload.model_dump())
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold


@threshold_router.put("/{threshold_id}", response_model=AlertThresholdOut)
def update_threshold(
    threshold_id: uuid.UUID,
    payload: AlertThresholdUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    threshold = db.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(threshold, field, value)
    db.commit()
    db.refresh(threshold)
    return threshold


@threshold_router.delete("/{threshold_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_threshold(
    threshold_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    threshold = db.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    db.delete(threshold)
    db.commit()
    return None
