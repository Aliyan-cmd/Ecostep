import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def auth_headers(client):
    """Register a test user and return Authorization headers."""
    client.post("/api/v1/auth/register", json={
        "email": "test@pytest.com",
        "password": "TestPass123",
        "name": "Pytest User"
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@pytest.com",
        "password": "TestPass123"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
