from datetime import datetime, timedelta
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.config import settings
from app.database import get_collection
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
    log_audit_event
)
from app.models import UserRole
from app.models.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    PasswordReset,
    UserResponse,
    TokenResponse
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    users_col = get_collection("users")
    existing = await users_col.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_dict = user_in.model_dump()
    raw_password = user_dict.pop("password")
    user_dict["hashed_password"] = hash_password(raw_password)
    user_dict["email"] = user_dict["email"].lower()
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    user_dict["_id"] = str(uuid.uuid4())

    await users_col.insert_one(user_dict)
    user_dict["id"] = user_dict["_id"]

    token = create_access_token({
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
        "assigned_patient_ids": user_dict.get("assigned_patient_ids", [])
    })

    await log_audit_event(user_dict["id"], "user_registered", "users", user_dict["id"])

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user_dict)
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_col = get_collection("users")
    user = await users_col.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an administrator."
        )

    user["id"] = str(user["_id"])
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "assigned_patient_ids": user.get("assigned_patient_ids", [])
    })

    await log_audit_event(user["id"], "user_login", "users", user["id"])

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset):
    users_col = get_collection("users")
    user = await users_col.find_one({"email": reset_data.email.lower()})
    if not user:
        # Prevent account enumeration in production
        return {"message": "If an account exists for this email, password update processed."}

    new_hash = hash_password(reset_data.new_password)
    await users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": new_hash, "updated_at": datetime.utcnow()}}
    )

    await log_audit_event(str(user["_id"]), "password_reset", "users", str(user["_id"]))
    return {"message": "Password has been successfully updated."}

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    users_col = get_collection("users")
    users = await users_col.find().to_list()
    for u in users:
        u["id"] = str(u["_id"])
    return [UserResponse(**u) for u in users]

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    users_col = get_collection("users")
    user = await users_col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    patch = {k: v for k, v in update_data.model_dump(exclude_unset=True).items()}
    patch["updated_at"] = datetime.utcnow()

    await users_col.update_one({"_id": user_id}, {"$set": patch})
    updated = await users_col.find_one({"_id": user_id})
    updated["id"] = str(updated["_id"])

    await log_audit_event(current_user["id"], "user_updated", "users", user_id, patch)
    return UserResponse(**updated)
