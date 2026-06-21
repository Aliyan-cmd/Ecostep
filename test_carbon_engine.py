import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def _auth():
    resp = client.post("/api/v1/auth/register", json={"email": "carbon@test.com", "password": "TestPass123", "name": "Carbon Test"})
    if resp.status_code == 409:
        resp = client.post("/api/v1/auth/login", json={"email": "carbon@test.com", "password": "TestPass123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_standard_gasoline_trip():
    headers = _auth()
    response = client.post(
        "/calculate/transport",
        json={"sub_category": "gasoline_car", "distance_miles": 100},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "TRANSPORT"
    assert data["sub_category"] == "gasoline_car"
    assert data["computed_co2e_kg"] == 34.2
    assert data["unit"] == "miles"

def test_ev_efficiency_variance():
    headers = _auth()
    response1 = client.post(
        "/calculate/transport",
        json={"sub_category": "ev_car", "distance_miles": 50},
        headers=headers
    )
    assert response1.status_code == 200
    assert response1.json()["computed_co2e_kg"] == 4.25

    response2 = client.post(
        "/calculate/transport",
        json={"sub_category": "ev_car", "distance_miles": 100},
        headers=headers
    )
    assert response2.status_code == 200
    assert response2.json()["computed_co2e_kg"] == 8.5

def test_regional_electricity_comparison():
    headers = _auth()
    response_texas = client.post(
        "/calculate/utility",
        json={"sub_category": "electricity_kwh", "quantity": 100, "grid_zone": "US_TEXAS"},
        headers=headers
    )
    assert response_texas.status_code == 200

    response_west = client.post(
        "/calculate/utility",
        json={"sub_category": "electricity_kwh", "quantity": 100, "grid_zone": "US_WEST"},
        headers=headers
    )
    assert response_west.status_code == 200

    texas_emissions = response_texas.json()["computed_co2e_kg"]
    west_emissions = response_west.json()["computed_co2e_kg"]

    assert texas_emissions > west_emissions
    assert texas_emissions == 41.2
    assert west_emissions == 24.5

def test_negative_input_validation():
    headers = _auth()
    response = client.post(
        "/calculate/transport",
        json={"sub_category": "gasoline_car", "distance_miles": -10},
        headers=headers
    )
    assert response.status_code == 422
    assert "greater than 0" in response.text or "gt" in response.text

    response_diet = client.post(
        "/calculate/diet",
        json={"sub_category": "vegan", "days": 0},
        headers=headers
    )
    assert response_diet.status_code == 422

def test_malformed_schema_validation():
    headers = _auth()
    response_missing = client.post(
        "/calculate/transport",
        json={"sub_category": "gasoline_car"},
        headers=headers
    )
    assert response_missing.status_code == 422

    response_invalid_enum = client.post(
        "/calculate/transport",
        json={"sub_category": "diesel_truck", "distance_miles": 100},
        headers=headers
    )
    assert response_invalid_enum.status_code == 422

    response_missing_grid = client.post(
        "/calculate/utility",
        json={"sub_category": "electricity_kwh", "quantity": 50},
        headers=headers
    )
    assert response_missing_grid.status_code == 422
    assert response_missing_grid.json()["detail"] == "grid_zone is required for electricity_kwh"
