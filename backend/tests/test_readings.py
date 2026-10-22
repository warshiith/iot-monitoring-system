import pytest


@pytest.fixture
def device(client, auth_headers):
    resp = client.post(
        "/api/devices",
        json={"device_id": "ESP32-READ", "device_name": "Reading Device"},
        headers=auth_headers,
    )
    return resp.json()


def test_insert_reading(client, auth_headers, device):
    resp = client.post(
        "/api/readings",
        json={"device_id": "ESP32-READ", "sensor_type": "temperature", "value": 25.5, "unit": "°C"},
    )
    assert resp.status_code == 201

    list_resp = client.get("/api/readings", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["value"] == 25.5


def test_reading_unknown_device(client):
    resp = client.post(
        "/api/readings",
        json={"device_id": "NOT-REAL", "sensor_type": "temperature", "value": 20},
    )
    assert resp.status_code == 404


def test_reading_invalid_value(client, device):
    resp = client.post(
        "/api/readings",
        json={"device_id": "ESP32-READ", "sensor_type": "temperature", "value": "not-a-number"},
    )
    assert resp.status_code == 422


def test_reading_updates_device_last_seen(client, auth_headers, device):
    client.post(
        "/api/readings",
        json={"device_id": "ESP32-READ", "sensor_type": "temperature", "value": 25.5},
    )
    resp = client.get(f"/api/devices/{device['id']}", headers=auth_headers)
    assert resp.json()["last_seen"] is not None
    assert resp.json()["status"] == "ONLINE"


def test_latest_readings(client, auth_headers, device):
    client.post("/api/readings", json={"device_id": "ESP32-READ", "sensor_type": "temperature", "value": 20})
    client.post("/api/readings", json={"device_id": "ESP32-READ", "sensor_type": "temperature", "value": 22})
    resp = client.get("/api/readings/latest", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["value"] == 22
