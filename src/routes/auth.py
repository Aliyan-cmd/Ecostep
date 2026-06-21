from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel, field_validator
import re
import uuid

from src.auth.jwt_handler import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# In-memory user store (phase-appropriate; replace with PostgreSQL in production)
_users: dict[str, dict] = {}

# ── Auth dependency (defined first so endpoint decorators can reference it) ──

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload

# ── Request / Response models ──

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v):
            raise ValueError("Invalid email format")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str


class UserPublic(BaseModel):
    user_id: str
    email: str
    name: str

# ── Endpoints ──

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    if body.email in _users:
        raise HTTPException(status_code=409, detail="Email already in use")

    user_id = str(uuid.uuid4())
    _users[body.email] = {
        "user_id": user_id,
        "email": body.email,
        "name": body.name,
        "password_hash": hash_password(body.password),
    }

    access_token = create_access_token({"sub": user_id, "email": body.email, "name": body.name})
    return AuthResponse(access_token=access_token, user_id=user_id, name=body.name)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    user = _users.get(body.email.lower().strip())
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user["user_id"], "email": user["email"], "name": user["name"]})
    return AuthResponse(access_token=access_token, user_id=user["user_id"], name=user["name"])


@router.get("/me", response_model=UserPublic)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserPublic(user_id=current_user["sub"], email=current_user["email"], name=current_user["name"])
