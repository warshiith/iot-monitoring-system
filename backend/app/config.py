from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://iot_user:iot_password@db:5432/iot_monitoring"

    JWT_SECRET_KEY: str = "change_this_to_a_long_random_secret_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    MQTT_BROKER_HOST: str = "mqtt-broker"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_TOPIC_PREFIX: str = "iot/devices"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    DEVICE_OFFLINE_TIMEOUT_SECONDS: int = 120
    SIMULATOR_ENABLED: bool = True
    SIMULATOR_INTERVAL_SECONDS: int = 5

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
