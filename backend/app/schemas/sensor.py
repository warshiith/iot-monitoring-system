import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SensorCreate(BaseModel):
    device_id: uuid.UUID
    sensor_type: str = Field(min_length=1, max_length=50)
    sensor_name: str = Field(min_length=1, max_length=150)
    unit: str = Field(min_length=1, max_length=20)
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None


class SensorUpdate(BaseModel):
    sensor_name: Optional[str] = None
    unit: Optional[str] = None
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None


class SensorOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    sensor_type: str
    sensor_name: str
    unit: str
    minimum_value: Optional[float]
    maximum_value: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
