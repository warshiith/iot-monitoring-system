import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_type = Column(String(50), nullable=False)
    sensor_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    alert_type = Column(String(20), nullable=False)  # HIGH / LOW
    severity = Column(String(20), default="MEDIUM", nullable=False)
    message = Column(String(500), nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
