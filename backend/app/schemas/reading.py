import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ReadingCreate(BaseModel):
    device_id: str
    sensor_type: str = Field(min_length=1, max_length=50)
    value: float
    unit: Optional[str] = None
    timestamp: Optional[datetime] = None

    @field_validator("value")
    @classmethod
    def value_must_be_finite(cls, v):
        import math
        if math.isnan(v) or math.isinf(v):
            raise ValueError("value must be a finite number")
        return v


class ReadingOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    sensor_id: Optional[uuid.UUID]
    sensor_type: str
    value: float
    unit: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ReadingStats(BaseModel):
    sensor_type: str
    min_value: Optional[float]
    max_value: Optional[float]
    avg_value: Optional[float]
    count: int
