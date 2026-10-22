import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.device import DeviceStatus


class DeviceCreate(BaseModel):
    device_id: str = Field(min_length=1, max_length=100)
    device_name: str = Field(min_length=1, max_length=150)
    description: Optional[str] = None
    location: Optional[str] = None
    device_type: Optional[str] = None


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    device_type: Optional[str] = None
    status: Optional[DeviceStatus] = None


class DeviceOut(BaseModel):
    id: uuid.UUID
    device_id: str
    device_name: str
    description: Optional[str]
    location: Optional[str]
    device_type: Optional[str]
    status: DeviceStatus
    api_key: str
    created_at: datetime
    updated_at: datetime
    last_seen: Optional[datetime]

    class Config:
        from_attributes = True
