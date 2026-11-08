from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool = True
    assigned_patient_ids: list[str] = Field(default_factory=list)

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    assigned_patient_ids: Optional[list[str]] = None

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
