from pydantic import BaseModel, Field
from typing import Literal

# --- Input Models ---

class UserProfileDefaults(BaseModel):
    location: str
    home_grid_zone: str
    owns_ev: bool
    commute_distance_miles: float

class TrailingAggregates(BaseModel):
    transport_kg: float
    utilities_kg: float
    diet_kg: float

class RealTimeContext(BaseModel):
    weather_status: Literal["Clear", "Mild", "Rain", "Snow", "Storm"]
    grid_intensity_score: int = Field(..., ge=1, le=100)

class UserContextPayload(BaseModel):
    profile: UserProfileDefaults
    aggregates: TrailingAggregates
    context: RealTimeContext

# --- Output Model ---

class NudgeRecommendation(BaseModel):
    action_id: str
    headline: str
    impact_metric: str
    category: Literal["transport", "utility", "diet"]

# --- Prioritization Matrix Engine ---

def evaluate_nudges(payload: UserContextPayload) -> NudgeRecommendation:
    """
    Evaluates the user's historical footprint and real-time context
    to recommend the highest-impact micro-action.
    """
    scores = {
        "utility_delay": 0,
        "transit_bike": 0,
        "diet_meatless": 0
    }
    
    # 1. Evaluate Utility Delay
    # Check if utility is high and grid is dirty (>70)
    utility_baseline_estimate = 30.0  # kgCO2e weekly baseline assumption for triggering
    if payload.aggregates.utilities_kg > utility_baseline_estimate and payload.context.grid_intensity_score > 70:
        scores["utility_delay"] += 50
        
    # Additional penalty boost if the grid is extremely high
    if payload.context.grid_intensity_score > 85:
        scores["utility_delay"] += 30

    # 2. Evaluate Transit / Biking
    # Check if weather permits active transit and commute is reasonable
    if payload.context.weather_status in ["Clear", "Mild"] and payload.profile.commute_distance_miles < 10:
        scores["transit_bike"] += 45
        
    # Strictly suppress outdoor active transit in bad weather
    if payload.context.weather_status in ["Rain", "Snow", "Storm"]:
        scores["transit_bike"] -= 100

    # 3. Evaluate Diet
    # Check if diet is the dominant source of emissions
    if payload.aggregates.diet_kg > payload.aggregates.transport_kg and payload.aggregates.diet_kg > payload.aggregates.utilities_kg:
        scores["diet_meatless"] += 60

    # Select the winning action based on highest score
    best_action = max(scores, key=scores.get)
    
    # Fallback to diet if all scores are zero or negative
    if scores[best_action] <= 0:
        best_action = "diet_meatless"

    # Map to final outputs
    if best_action == "utility_delay":
        return NudgeRecommendation(
            action_id="act_util_delay_01",
            headline="Delay running your heavy appliances",
            impact_metric="Saves 2.4 kg CO2e",
            category="utility"
        )
    elif best_action == "transit_bike":
        return NudgeRecommendation(
            action_id="act_trans_bike_01",
            headline="Bike to work today",
            impact_metric="Saves 3.1 kg CO2e",
            category="transport"
        )
    else:
        return NudgeRecommendation(
            action_id="act_diet_meatless_01",
            headline="Try a meatless lunch today",
            impact_metric="Saves 4.3 kg CO2e",
            category="diet"
        )
