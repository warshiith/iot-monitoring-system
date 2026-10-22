import pytest


@pytest.fixture
def device_with_threshold(client, auth_headers):
    device_resp = client.post(
        "/api/devices",
        json={"device_id": "ESP32-ALERT", "device_name": "Alert Device"},
        headers=auth_headers,
    )
    device = device_resp.json()
    client.post(
        "/api/thresholds",
        json={
            "device_id": device["id"],
            "sensor_type": "temperature",
            "minimum_threshold": 10,
            "maximum_threshold": 40,
            "severity": "HIGH",
        },
        headers=auth_headers,
    )
    return device


def test_threshold_creation(client, auth_headers, device_with_threshold):
    resp = client.get(f"/api/thresholds?device_id={device_with_threshold['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_alert_created_on_high_reading(client, auth_headers, device_with_threshold):
    resp = client.post(
        "/api/readings",
        json={"device_id": "ESP32-ALERT", "sensor_type": "temperature", "value": 55},
    )
    assert resp.status_code == 201
    assert "alert" in resp.json()["data"]

    alerts_resp = client.get("/api/alerts", headers=auth_headers)
    assert alerts_resp.status_code == 200
    assert len(alerts_resp.json()) == 1
    assert alerts_resp.json()[0]["alert_type"] == "HIGH"


def test_no_alert_within_range(client, auth_headers, device_with_threshold):
    client.post(
        "/api/readings",
        json={"device_id": "ESP32-ALERT", "sensor_type": "temperature", "value": 25},
    )
    alerts_resp = client.get("/api/alerts", headers=auth_headers)
    assert len(alerts_resp.json()) == 0


def test_no_duplicate_alerts_for_unchanged_state(client, auth_headers, device_with_threshold):
    client.post("/api/readings", json={"device_id": "ESP32-ALERT", "sensor_type": "temperature", "value": 55})
    client.post("/api/readings", json={"device_id": "ESP32-ALERT", "sensor_type": "temperature", "value": 56})
    alerts_resp = client.get("/api/alerts", headers=auth_headers)
    assert len(alerts_resp.json()) == 1


def test_acknowledge_alert(client, auth_headers, device_with_threshold):
    client.post("/api/readings", json={"device_id": "ESP32-ALERT", "sensor_type": "temperature", "value": 55})
    alerts_resp = client.get("/api/alerts", headers=auth_headers)
    alert_id = alerts_resp.json()[0]["id"]

    ack_resp = client.put(f"/api/alerts/{alert_id}/acknowledge", headers=auth_headers)
    assert ack_resp.status_code == 200
    assert ack_resp.json()["is_acknowledged"] is True
