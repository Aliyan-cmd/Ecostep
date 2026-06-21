from fastapi import FastAPI, HTTPException, status, Request, UploadFile, File, Depends
from fastapi.responses import Response
from pydantic import BaseModel, Field, ValidationError
from typing import Literal, Optional, Dict, Any
from datetime import datetime, UTC
import uuid
import time
import sys
import os
from nudge_engine import UserContextPayload, NudgeRecommendation, evaluate_nudges

sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from src.ai.scanner import parse_receipt_image
from src.fintech.roundup import eco_roundup_engine
from src.routes.auth import router as auth_router, get_current_user

# Prometheus Metrics Telemetry
try:
    from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
    REQUEST_COUNT = Counter('app_request_count', 'Total API requests', ['method', 'endpoint', 'http_status'])
    REQUEST_LATENCY = Histogram('app_request_latency_seconds', 'API request latency', ['endpoint'])
    METRICS_ENABLED = True
except ImportError:
    METRICS_ENABLED = False

app = FastAPI(
    title="EcoStep Carbon Accounting Engine & Ingestion Gateway",
    description="Calculates carbon footprint and ingests webhooks for Phase 2.",
    version="1.1.0"
)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/health", summary="Health check")
def health():
    return {"status": "ok", "version": "1.1.0"}

@app.middleware("http")
async def prometheus_telemetry_middleware(request: Request, call_next):
    if not METRICS_ENABLED or request.url.path == "/metrics":
        return await call_next(request)
        
    start_time = time.time()
    endpoint = request.url.path
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        raise e
    finally:
        latency = time.time() - start_time
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)
        REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, http_status=status_code).inc()
        
    return response

@app.get("/metrics", summary="Prometheus scrape endpoint")
def get_metrics():
    if not METRICS_ENABLED:
        return Response(content="Metrics not enabled", status_code=503)
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

# --- Static Emission Factors (kgCO2e per unit) ---
TRANSPORT_FACTORS = {
    "gasoline_car": 0.342,
    "hybrid_car": 0.194,
    "ev_car": 0.085,
    "public_transit": 0.078
}

UTILITY_FACTORS = {
    "natural_gas_therm": 5.306,
}

GRID_ZONES = {
    "US_EAST": 0.368,
    "US_WEST": 0.245,
    "US_TEXAS": 0.412,
    "AEO_NATIONAL": 0.352
}

DIET_FACTORS = {
    "high_meat": 7.26,
    "vegetarian": 3.81,
    "vegan": 2.89
}

# --- Pydantic Models (Phase 1) ---

class CalculationResponse(BaseModel):
    ledger_id: str
    category: str
    sub_category: str
    raw_quantity: float
    unit: str
    computed_co2e_kg: float
    timestamp: datetime

class TransportRequest(BaseModel):
    sub_category: Literal["gasoline_car", "hybrid_car", "ev_car", "public_transit"]
    distance_miles: float = Field(..., gt=0, description="Distance traveled in miles.")

class UtilityRequest(BaseModel):
    sub_category: Literal["natural_gas_therm", "electricity_kwh"]
    quantity: float = Field(..., gt=0, description="Quantity of utility consumed.")
    grid_zone: Optional[Literal["US_EAST", "US_WEST", "US_TEXAS", "AEO_NATIONAL"]] = Field(
        None, description="Grid zone is required if sub_category is electricity_kwh"
    )

class DietRequest(BaseModel):
    sub_category: Literal["high_meat", "vegetarian", "vegan"]
    days: float = Field(..., gt=0, description="Number of days for the dietary footprint.")

# --- Ingestion Webhook Models (Phase 2) ---

class WebhookIngestRequest(BaseModel):
    source: Literal["smart_utility", "mobility", "manual"]
    payload: Dict[str, Any]

class WebhookResponse(BaseModel):
    status: str
    task_id: str
    message: str
    ledger_preview: Optional[CalculationResponse] = None

# --- Pure Calculation Helpers (no auth dependency) ---

def _calc_transport(req: TransportRequest) -> CalculationResponse:
    factor = TRANSPORT_FACTORS[req.sub_category]
    co2e = req.distance_miles * factor
    return CalculationResponse(
        ledger_id=str(uuid.uuid4()),
        category="TRANSPORT",
        sub_category=req.sub_category,
        raw_quantity=req.distance_miles,
        unit="miles",
        computed_co2e_kg=round(co2e, 4),
        timestamp=datetime.now(UTC)
    )

def _calc_utility(req: UtilityRequest) -> CalculationResponse:
    if req.sub_category == "electricity_kwh":
        if not req.grid_zone:
            raise HTTPException(status_code=422, detail="grid_zone is required for electricity_kwh")
        factor = GRID_ZONES[req.grid_zone]
        unit = "kWh"
    else:
        factor = UTILITY_FACTORS[req.sub_category]
        unit = "therms"
    co2e = req.quantity * factor
    return CalculationResponse(
        ledger_id=str(uuid.uuid4()),
        category="UTILITIES",
        sub_category=req.sub_category,
        raw_quantity=req.quantity,
        unit=unit,
        computed_co2e_kg=round(co2e, 4),
        timestamp=datetime.now(UTC)
    )

def _calc_diet(req: DietRequest) -> CalculationResponse:
    factor = DIET_FACTORS[req.sub_category]
    co2e = req.days * factor
    return CalculationResponse(
        ledger_id=str(uuid.uuid4()),
        category="DIET",
        sub_category=req.sub_category,
        raw_quantity=req.days,
        unit="days",
        computed_co2e_kg=round(co2e, 4),
        timestamp=datetime.now(UTC)
    )

# --- Core Calculation Endpoints (Phase 1) ---

@app.post("/calculate/transport", response_model=CalculationResponse)
def calculate_transport(request: TransportRequest, current_user: dict = Depends(get_current_user)):
    return _calc_transport(request)

@app.post("/calculate/utility", response_model=CalculationResponse)
def calculate_utility(request: UtilityRequest, current_user: dict = Depends(get_current_user)):
    return _calc_utility(request)

@app.post("/calculate/diet", response_model=CalculationResponse)
def calculate_diet(request: DietRequest, current_user: dict = Depends(get_current_user)):
    return _calc_diet(request)

# --- Ingestion Endpoint (Phase 2) ---

@app.post("/api/v1/ingest/webhook", response_model=WebhookResponse, status_code=status.HTTP_202_ACCEPTED)
def ingest_webhook(request: WebhookIngestRequest, current_user: dict = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    calc_res = None
    
    try:
        if request.source == "smart_utility":
            if "kwh_used" not in request.payload:
                raise HTTPException(status_code=422, detail="Missing 'kwh_used' parameter in smart utility payload")
            req = UtilityRequest(
                sub_category="electricity_kwh",
                quantity=request.payload["kwh_used"],
                grid_zone="AEO_NATIONAL"
            )
            calc_res = _calc_utility(req)
            
        elif request.source == "mobility":
            if "distance_miles" not in request.payload:
                raise HTTPException(status_code=422, detail="Missing 'distance_miles' parameter in mobility payload")
            activity = request.payload.get("activity", "driving")
            sub_category = "gasoline_car"
            if activity == "driving":
                sub_category = "gasoline_car"
            elif activity == "transit":
                sub_category = "public_transit"
            req = TransportRequest(
                sub_category=sub_category,
                distance_miles=request.payload["distance_miles"]
            )
            calc_res = _calc_transport(req)
            
        elif request.source == "manual":
            category = request.payload.get("category")
            data = request.payload.get("data", {})
            if category == "transport":
                req = TransportRequest(**data)
                calc_res = _calc_transport(req)
            elif category == "utility":
                req = UtilityRequest(**data)
                calc_res = _calc_utility(req)
            elif category == "diet":
                req = DietRequest(**data)
                calc_res = _calc_diet(req)
            else:
                raise HTTPException(status_code=422, detail="Invalid or missing category in manual payload")
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
        
    return WebhookResponse(
        status="Accepted",
        task_id=task_id,
        message=f"Payload successfully parsed and queued for {request.source}",
        ledger_preview=calc_res
    )

# --- Nudge Engine Endpoint (Phase 3) ---

@app.post("/api/v1/nudge/recommend", response_model=NudgeRecommendation)
def get_nudge_recommendation(payload: UserContextPayload, current_user: dict = Depends(get_current_user)):
    nudge = evaluate_nudges(payload)
    if not nudge:
        nudge = NudgeRecommendation(
            action_id="act_general_01",
            headline="Turn off unused lights",
            impact_metric="Saves 0.5 kg CO2e",
            category="utility"
        )
    return nudge

@app.post("/api/v1/scan-receipt")
async def scan_receipt(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    result = parse_receipt_image(contents)
    return result

class PlaidTransactionPayload(BaseModel):
    user_id: str
    transaction_id: str
    amount_cents: int

@app.post("/api/v1/fintech/transaction")
async def process_fintech_transaction(payload: PlaidTransactionPayload, current_user: dict = Depends(get_current_user)):
    result = eco_roundup_engine.process_transaction(payload.user_id, payload.amount_cents)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
