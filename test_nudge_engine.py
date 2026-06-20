import pytest
from nudge_engine import UserContextPayload, UserProfileDefaults, TrailingAggregates, RealTimeContext, evaluate_nudges

def test_high_grid_poor_weather():
    """
    Test Case 1: High grid intensity and poor weather.
    Confirms transit nudges are suppressed and utility conservation wins.
    """
    payload = UserContextPayload(
        profile=UserProfileDefaults(location="Seattle", home_grid_zone="US_WEST", owns_ev=False, commute_distance_miles=5),
        aggregates=TrailingAggregates(transport_kg=10, utilities_kg=40, diet_kg=20),
        context=RealTimeContext(weather_status="Rain", grid_intensity_score=80)
    )
    result = evaluate_nudges(payload)
    
    # Transit is suppressed due to Rain, Utility should win due to high grid intensity & high utility baseline
    assert result.category == "utility"
    assert result.action_id == "act_util_delay_01"
    assert result.headline == "Delay running your heavy appliances"

def test_neutral_environment_diet_spike():
    """
    Test Case 2: Neutral environment, but diet footprint dominates.
    Confirms dietary micro-action surfaces.
    """
    payload = UserContextPayload(
        profile=UserProfileDefaults(location="Austin", home_grid_zone="US_TEXAS", owns_ev=False, commute_distance_miles=15),
        aggregates=TrailingAggregates(transport_kg=20, utilities_kg=20, diet_kg=60),
        context=RealTimeContext(weather_status="Mild", grid_intensity_score=50) # Neutral context
    )
    result = evaluate_nudges(payload)
    
    # Diet dominates historical ledger, weather is mild but commute is > 10 miles so transit doesn't get high score
    assert result.category == "diet"
    assert result.action_id == "act_diet_meatless_01"
    assert result.headline == "Try a meatless lunch today"
