def test_create_device(client, auth_headers):
    resp = client.post(
        "/api/devices",
        json={"device_id": "ESP32-TEST", "device_name": "Test Device", "location": "Lab"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["device_id"] == "ESP32-TEST"
    assert "api_key" in resp.json()


def test_create_duplicate_device(client, auth_headers):
    payload = {"device_id": "ESP32-DUP", "device_name": "Dup Device"}
    client.post("/api/devices", json=payload, headers=auth_headers)
    resp = client.post("/api/devices", json=payload, headers=auth_headers)
    assert resp.status_code == 400


def test_list_devices(client, auth_headers):
    client.post("/api/devices", json={"device_id": "ESP32-A", "device_name": "A"}, headers=auth_headers)
    resp = client.get("/api/devices", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_device_by_id(client, auth_headers):
    create_resp = client.post("/api/devices", json={"device_id": "ESP32-B", "device_name": "B"}, headers=auth_headers)
    device_id = create_resp.json()["id"]
    resp = client.get(f"/api/devices/{device_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["device_id"] == "ESP32-B"


def test_device_requires_auth(client):
    resp = client.get("/api/devices")
    assert resp.status_code == 401
