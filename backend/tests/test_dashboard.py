def test_dashboard_summary(client, auth_headers):
    client.post("/api/devices", json={"device_id": "ESP32-DASH", "device_name": "Dash Device"}, headers=auth_headers)
    client.post("/api/readings", json={"device_id": "ESP32-DASH", "sensor_type": "temperature", "value": 22})

    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_devices"] == 1
    assert data["online_devices"] == 1
    assert len(data["latest_values"]) == 1
