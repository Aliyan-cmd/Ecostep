import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def _auth():
    resp = client.post("/api/v1/auth/register", json={"email": "ingest@test.com", "password": "TestPass123", "name": "Ingest Test"})
    if resp.status_code == 409:
        resp = client.post("/api/v1/auth/login", json={"email": "ingest@test.com", "password": "TestPass123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_manual_submission_hybrid_car():
    headers = _auth()
    payload = {
        "source": "manual",
        "payload": {
            "category": "transport",
            "data": {
                "sub_category": "hybrid_car",
                "distance_miles": 45
            }
        }
    }

    response = client.post("/api/v1/ingest/webhook", json=payload, headers=headers)

    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "Accepted"
    assert "task_id" in data

    preview = data["ledger_preview"]
    assert preview is not None
    assert preview["category"] == "TRANSPORT"
    assert preview["sub_category"] == "hybrid_car"
    assert preview["raw_quantity"] == 45
    assert preview["computed_co2e_kg"] == 8.73


def test_malformed_automated_webhook():
    headers = _auth()
    malformed_payload = {
        "source": "mobility",
        "payload": {
            "activity": "driving",
            "timestamp": "2026-06-20T18:30:00Z"
        }
    }

    response = client.post("/api/v1/ingest/webhook", json=malformed_payload, headers=headers)

    assert response.status_code == 422
    data = response.json()
    assert "Missing 'distance_miles'" in data["detail"]


def test_valid_smart_utility_webhook():
    headers = _auth()
    payload = {
        "source": "smart_utility",
        "payload": {
            "device_id": "nest-4920",
            "kwh_used": 14.2,
            "timestamp": "2026-06-20T18:00:00Z"
        }
    }

    response = client.post("/api/v1/ingest/webhook", json=payload, headers=headers)

    assert response.status_code == 202
    data = response.json()
    preview = data["ledger_preview"]
    assert preview["sub_category"] == "electricity_kwh"
    assert preview["raw_quantity"] == 14.2
