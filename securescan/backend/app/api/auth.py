from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import re

from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.database.connection import get_database
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.models.user import UserModel

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user account."""
    db = get_database()

    # Normalize identifiers
    email_clean = request.email.lower().strip()
    name = (request.name or "").strip()
    username = (request.username or "").strip()

    if not username:
        if name:
            username = re.sub(r"[^a-zA-Z0-9_]", "_", name).lower()
        else:
            username = email_clean.split("@")[0]

    # Check if email already taken
    existing = await db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Check if username already taken
    existing_username = await db.users.find_one({"username": username})
    if existing_username:
        # Append a short unique suffix if needed
        username = f"{username}_{str(datetime.now().microsecond)[:4]}"

    user = UserModel(
        email=email_clean,
        name=name or username,
        username=username,
        hashed_password=hash_password(request.password),
    )

    await db.users.insert_one(user.model_dump(by_alias=True))

    token = create_access_token(data={"sub": user.id, "email": user.email})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            username=user.username,
            is_active=user.is_active,
            created_at=user.created_at,
            scan_count=user.scan_count,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate a user and return a JWT token."""
    db = get_database()

    email_clean = request.email.lower().strip()
    user_doc = await db.users.find_one({"email": email_clean})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    stored_hash = user_doc.get("hashed_password") or user_doc.get("password_hash")
    if not stored_hash or not verify_password(request.password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(data={"sub": user_doc["_id"], "email": user_doc["email"]})

    # Update last login
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_doc["_id"],
            name=user_doc.get("name") or user_doc.get("username"),
            email=user_doc["email"],
            username=user_doc.get("username", user_doc["email"].split("@")[0]),
            is_active=user_doc.get("is_active", True),
            created_at=user_doc["created_at"],
            scan_count=user_doc.get("scan_count", 0),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=current_user["_id"],
        name=current_user.get("name") or current_user.get("username"),
        email=current_user["email"],
        username=current_user.get("username", current_user["email"].split("@")[0]),
        is_active=current_user.get("is_active", True),
        created_at=current_user["created_at"],
        scan_count=current_user.get("scan_count", 0),
    )
