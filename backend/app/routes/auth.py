from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from app.models.patient import (
    search_patient_by_email,
    assign_admin,
    update_reset_token,
    update_password,
    check_reset_token_expiration,
)
from pydantic import BaseModel
from app.utils.auth import (
    admin_required,
    verify_password,
    create_access_token,
    set_password,
)
from app.services.email_service import send_password_reset_email
from datetime import datetime, timedelta, timezone
import secrets
from app.config import FRONTEND_URL


router = APIRouter()


class LoginInput(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Search for patient by email
    user = search_patient_by_email(form_data.username)

    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ Generate CSRF token securely
    csrf_token = secrets.token_urlsafe(32)

    # Create JWT token (expires in 1 hour)
    ACCESS_TOKEN_EXPIRATION_SECONDS = 3600
    # we store the email and role in the token
    token = create_access_token(
        data={
            "sub": user["email"],
            "role": "admin" if user.get("is_admin") else "patient",
        },
        expires_delta=timedelta(seconds=ACCESS_TOKEN_EXPIRATION_SECONDS),
    )
    response = JSONResponse(
        {
            "message": "Login successful",
            "access_token": token,
            "token_type": "Bearer",
            "fhir_id": user["fhir_id"],
            "role": "admin" if user.get("is_admin") else "patient",
        }
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=True,
        samesite="Strict",
        max_age=ACCESS_TOKEN_EXPIRATION_SECONDS,  # expires in 1 hour, matches JWT lifespan
        path="/",
    )
    return response


@router.get("/check-email")
async def check_patient_exists(email: str = Query(...)):
    """Check if a patient exists by email."""
    existing_patient = search_patient_by_email(email)
    if existing_patient:
        return {"message": "Patient exists. Please log in.", "exists": True}
    return {"message": "Patient not found. You can register now.", "exists": False}


@router.get("/assign-admin")
async def assign_admin_role(email: str, current_user: dict = Depends(admin_required)):
    """Assign admin role to a patient."""
    user = search_patient_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "admin":
        raise HTTPException(
            status_code=409, detail=f'{user["email"]} is already an admin'
        )

    assign_admin(email)
    return {"message": f"{email} is now an admin"}


class ForgotPasswordRequest(BaseModel):
    email: str


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Find the patient by email
    patient = search_patient_by_email(request.email)

    if not patient:
        # To prevent email enumeration, we'll return the same message even if the email doesn't exist
        return {
            "message": "If an account exists with this email, you will receive password reset instructions."
        }

    # Generate a reset token
    reset_token = secrets.token_urlsafe(32)
    # Reset password token expires in 1 hour
    RESET_TOKEN_EXPIRATION_HOURS = 1
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=RESET_TOKEN_EXPIRATION_HOURS
    )

    # Store the reset token and expiry in MongoDB
    update_reset_token(request.email, reset_token, expires_at)

    # Send the reset email
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    try:
        # Send the reset email
        send_password_reset_email(
            to_email=request.email,
            expires_hours=RESET_TOKEN_EXPIRATION_HOURS,
            reset_link=reset_link,
        )
    except Exception as e:
        # If email sending fails, raise a 500 error
        raise HTTPException(
            status_code=500, detail=f"Failed to send password reset email: {str(e)}"
        )

    return {
        "message": "If an account exists with this email, you will receive password reset instructions."
    }


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    # Find the patient by reset token and check if token is not expired
    patient = check_reset_token_expiration(request.token)
    if not patient:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    hashed_password = set_password(request.new_password)
    # Update the patient document with the new password and remove the reset token and reset token expires
    update_password(patient["email"], hashed_password)

    return {"message": "Password has been reset successfully"}
