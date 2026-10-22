from typing import Optional, List
from pydantic import BaseModel


class LatestSensorValue(BaseModel):
    sensor_type: str
    value: float
    unit: Optional[str]
    device_id: str
    timestamp: str


class DashboardSummary(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    active_alerts: int
    latest_values: List[LatestSensorValue]
