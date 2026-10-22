import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AlertThresholdCreate(BaseModel):
    device_id: uuid.UUID
    sensor_type: str = Field(min_length=1, max_length=50)
    minimum_threshold: Optional[float] = None
    maximum_threshold: Optional[float] = None
    enabled: bool = True
    severity: str = "MEDIUM"


class AlertThresholdUpdate(BaseModel):
    minimum_threshold: Optional[float] = None
    maximum_threshold: Optional[float] = None
    enabled: Optional[bool] = None
    severity: Optional[str] = None


class AlertThresholdOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    sensor_type: str
    minimum_threshold: Optional[float]
    maximum_threshold: Optional[float]
    enabled: bool
    severity: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    sensor_type: str
    sensor_value: float
    threshold_value: float
    alert_type: str
    severity: str
    message: str
    is_acknowledged: bool
    created_at: datetime
    acknowledged_at: Optional[datetime]

    class Config:
        from_attributes = True
