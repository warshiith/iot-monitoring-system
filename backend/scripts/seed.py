"""Seed the database with a demo admin user, demo devices, sensors, and thresholds.

Run with: python -m scripts.seed
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.device import Device, DeviceStatus
from app.models.sensor import Sensor
from app.models.alert_threshold import AlertThreshold
from app.auth.security import hash_password

Base.metadata.create_all(bind=engine)

SENSOR_DEFS = [
    ("temperature", "Temperature", "°C", 10, 40),
    ("humidity", "Humidity", "%", 20, 80),
    ("air_quality", "Air Quality", "AQI", 0, 150),
    ("light_intensity", "Light Intensity", "lux", 0, 1000),
]

DEMO_DEVICES = [
    ("ESP32-001", "Greenhouse Sensor Node", "Greenhouse A", "environmental"),
    ("ESP32-002", "Server Room Monitor", "Server Room", "environmental"),
    ("ESP32-003", "Office Air Quality Station", "Main Office", "environmental"),
]


def run():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@iot.local").first():
            admin = User(
                name="Demo Admin",
                email="admin@iot.local",
                password_hash=hash_password("Admin@123"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            print("Created demo admin user: admin@iot.local / Admin@123")

        if not db.query(User).filter(User.email == "user@iot.local").first():
            demo_user = User(
                name="Demo Viewer",
                email="user@iot.local",
                password_hash=hash_password("User@123"),
                role=UserRole.user,
                is_active=True,
            )
            db.add(demo_user)
            print("Created demo standard user: user@iot.local / User@123")

        db.commit()

        for device_id, name, location, dtype in DEMO_DEVICES:
            device = db.query(Device).filter(Device.device_id == device_id).first()
            if not device:
                device = Device(
                    device_id=device_id,
                    device_name=name,
                    description=f"Demo device for {name}",
                    location=location,
                    device_type=dtype,
                    status=DeviceStatus.offline,
                )
                db.add(device)
                db.commit()
                db.refresh(device)
                print(f"Created device {device_id}")

            for sensor_type, sensor_name, unit, min_v, max_v in SENSOR_DEFS:
                sensor = (
                    db.query(Sensor)
                    .filter(Sensor.device_id == device.id, Sensor.sensor_type == sensor_type)
                    .first()
                )
                if not sensor:
                    sensor = Sensor(
                        device_id=device.id,
                        sensor_type=sensor_type,
                        sensor_name=sensor_name,
                        unit=unit,
                        minimum_value=min_v,
                        maximum_value=max_v,
                    )
                    db.add(sensor)

                threshold = (
                    db.query(AlertThreshold)
                    .filter(AlertThreshold.device_id == device.id, AlertThreshold.sensor_type == sensor_type)
                    .first()
                )
                if not threshold:
                    threshold = AlertThreshold(
                        device_id=device.id,
                        sensor_type=sensor_type,
                        minimum_threshold=min_v,
                        maximum_threshold=max_v,
                        enabled=True,
                        severity="HIGH" if sensor_type == "temperature" else "MEDIUM",
                    )
                    db.add(threshold)
            db.commit()

        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
