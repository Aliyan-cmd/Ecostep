import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_manual_submission_hybrid_car():
    """Test Case 1: Simulate user manually submitting a 45-mile hybrid car trip through the web UI form."""
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
    
    response = client.post("/api/v1/ingest/webhook", json=payload)
    
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "Accepted"
    assert "task_id" in data
    
    # Verify the internal calculation happened correctly
    preview = data["ledger_preview"]
    assert preview is not None
    assert preview["category"] == "TRANSPORT"
    assert preview["sub_category"] == "hybrid_car"
    assert preview["raw_quantity"] == 45
    assert preview["computed_co2e_kg"] == 8.73  # 45 * 0.194

def test_malformed_automated_webhook():
    """Test Case 2: Send a malformed automated webhook payload and verify it's gracefully caught."""
    # Missing required 'distance_miles' for mobility payload
    malformed_payload = {
        "source": "mobility",
        "payload": {
            "activity": "driving",
            "timestamp": "2026-06-20T18:30:00Z"
            # 'distance_miles' is missing
        }
    }
    
    response = client.post("/api/v1/ingest/webhook", json=malformed_payload)
    
    # Should be flagged as Unprocessable Entity (Validation Error)
    assert response.status_code == 422
    data = response.json()
    assert "Missing 'distance_miles'" in data["detail"]

def test_valid_smart_utility_webhook():
    """Bonus Test: Validate a successful Smart Utility webhook."""
    payload = {
        "source": "smart_utility",
        "payload": {
            "device_id": "nest-4920",
            "kwh_used": 14.2,
            "timestamp": "2026-06-20T18:00:00Z"
        }
    }
    
    response = client.post("/api/v1/ingest/webhook", json=payload)
    
    assert response.status_code == 202
    data = response.json()
    preview = data["ledger_preview"]
    assert preview["sub_category"] == "electricity_kwh"
    assert preview["raw_quantity"] == 14.2
