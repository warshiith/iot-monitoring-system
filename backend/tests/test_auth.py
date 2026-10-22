def test_register_user(client):
    resp = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "alice@test.com", "password": "password123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "alice@test.com"
    assert data["user"]["role"] == "admin"  # first registered user becomes admin
    assert "access_token" in data


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={"name": "Alice", "email": "alice@test.com", "password": "password123"})
    resp = client.post("/api/auth/register", json={"name": "Alice2", "email": "alice@test.com", "password": "password123"})
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/api/auth/register", json={"name": "Bob", "email": "bob@test.com", "password": "password123"})
    resp = client.post("/api/auth/login", json={"email": "bob@test.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"name": "Bob", "email": "bob@test.com", "password": "password123"})
    resp = client.post("/api/auth/login", json={"email": "bob@test.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_unauthorized_access_to_protected_route(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_endpoint(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"
