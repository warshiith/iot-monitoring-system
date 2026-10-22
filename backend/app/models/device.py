import enum
import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class DeviceStatus(str, enum.Enum):
    online = "ONLINE"
    offline = "OFFLINE"
    warning = "WARNING"


def generate_api_key() -> str:
    return secrets.token_hex(24)


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(100), unique=True, nullable=False, index=True)
    device_name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    location = Column(String(150), nullable=True)
    device_type = Column(String(100), nullable=True)
    status = Column(
        Enum(DeviceStatus, values_callable=lambda enum_cls: [e.value for e in enum_cls], name="devicestatus"),
        default=DeviceStatus.offline,
        nullable=False,
    )
    api_key = Column(String(64), unique=True, default=generate_api_key, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime(timezone=True), nullable=True)

    sensors = relationship("Sensor", back_populates="device", cascade="all, delete-orphan")
