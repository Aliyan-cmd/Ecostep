import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_standard_gasoline_trip():
    """Test a standard 100-mile gasoline trip calculation."""
    response = client.post(
        "/calculate/transport",
        json={"sub_category": "gasoline_car", "distance_miles": 100}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "TRANSPORT"
    assert data["sub_category"] == "gasoline_car"
    assert data["computed_co2e_kg"] == 34.2  # 100 * 0.342
    assert data["unit"] == "miles"

def test_ev_efficiency_variance():
    """Test EV efficiency variance by checking different distances."""
    # EV 50 miles
    response1 = client.post(
        "/calculate/transport",
        json={"sub_category": "ev_car", "distance_miles": 50}
    )
    assert response1.status_code == 200
    assert response1.json()["computed_co2e_kg"] == 4.25  # 50 * 0.085

    # EV 100 miles
    response2 = client.post(
        "/calculate/transport",
        json={"sub_category": "ev_car", "distance_miles": 100}
    )
    assert response2.status_code == 200
    assert response2.json()["computed_co2e_kg"] == 8.5  # 100 * 0.085

def test_regional_electricity_comparison():
    """Confirm that US_TEXAS electricity yields higher emissions than US_WEST for the same kWh."""
    # Texas
    response_texas = client.post(
        "/calculate/utility",
        json={
            "sub_category": "electricity_kwh",
            "quantity": 100,
            "grid_zone": "US_TEXAS"
        }
    )
    assert response_texas.status_code == 200
    
    # West
    response_west = client.post(
        "/calculate/utility",
        json={
            "sub_category": "electricity_kwh",
            "quantity": 100,
            "grid_zone": "US_WEST"
        }
    )
    assert response_west.status_code == 200
    
    texas_emissions = response_texas.json()["computed_co2e_kg"]
    west_emissions = response_west.json()["computed_co2e_kg"]
    
    # Asserting Texas > West
    assert texas_emissions > west_emissions
    assert texas_emissions == 41.2  # 100 * 0.412
    assert west_emissions == 24.5   # 100 * 0.245

def test_negative_input_validation():
    """Validation test confirming negative inputs return 422."""
    response = client.post(
        "/calculate/transport",
        json={"sub_category": "gasoline_car", "distance_miles": -10}
    )
    assert response.status_code == 422
    assert "greater than 0" in response.text or "gt" in response.text

    response_diet = client.post(
        "/calculate/diet",
        json={"sub_category": "vegan", "days": 0} # Must be gt=0
    )
    assert response_diet.status_code == 422

def test_malformed_schema_validation():
    """Validation test confirming malformed schemas return 422."""
    # Missing required field 'distance_miles'
    response_missing = client.post(
        "/calculate/transport",
        json={"sub_category": "gasoline_car"}
    )
    assert response_missing.status_code == 422

    # Invalid sub_category enum value
    response_invalid_enum = client.post(
        "/calculate/transport",
        json={"sub_category": "diesel_truck", "distance_miles": 100}
    )
    assert response_invalid_enum.status_code == 422

    # Missing grid_zone for electricity_kwh
    response_missing_grid = client.post(
        "/calculate/utility",
        json={"sub_category": "electricity_kwh", "quantity": 50}
    )
    assert response_missing_grid.status_code == 422
    assert response_missing_grid.json()["detail"] == "grid_zone is required for electricity_kwh"
