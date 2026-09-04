"""Authentication and User Profile Endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session

from backend.models import get_db, User, Farmer
from backend.middleware.authentication import verify_password, create_access_token, get_current_user, get_password_hash
import uuid

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    phone: str
    password: str
    full_name: str
    role: str = "FARMER"
    village: Optional[str] = "Karnal"
    district: Optional[str] = "Karnal"
    state: Optional[str] = "Haryana"
    preferred_language: Optional[str] = "hi"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == req.username) | (User.phone == req.username)).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/phone or password"
        )

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    farmer_id = user.farmer_profile[0].id if user.farmer_profile else None

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
            "farmer_id": farmer_id
        }
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == req.username) | (User.phone == req.phone)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or phone number already registered")

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        username=req.username,
        phone=req.phone,
        hashed_password=get_password_hash(req.password),
        role=req.role.upper(),
        full_name=req.full_name
    )
    db.add(new_user)
    db.flush()

    farmer_id = None
    if req.role.upper() == "FARMER":
        farmer = Farmer(
            id=f"frm-{uuid.uuid4().hex[:8]}",
            user_id=new_user.id,
            primary_phone=req.phone,
            village=req.village or "Village",
            district=req.district or "District",
            state=req.state or "State",
            preferred_language=req.preferred_language or "hi"
        )
        db.add(farmer)
        db.flush()
        farmer_id = farmer.id

    db.commit()

    token = create_access_token({"sub": new_user.username, "role": new_user.role, "id": new_user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "phone": new_user.phone,
            "role": new_user.role,
            "farmer_id": farmer_id
        }
    }

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user)):
    farmer_id = user.farmer_profile[0].id if user.farmer_profile else None
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "farmer_id": farmer_id
    }
