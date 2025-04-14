from fastapi import APIRouter, HTTPException, Depends
from app.models.patient import search_patient_by_email, assign_admin, update_reset_token, update_password, check_reset_token_expiration
from pydantic import BaseModel
from app.utils.auth import admin_required, verify_password, create_access_token, set_password
from datetime import datetime, timedelta, timezone
import secrets

router = APIRouter()

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(credentials: LoginInput):
    # Search for patient by email
    user = search_patient_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify the password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    token = create_access_token(data={
        "sub": user["email"],
        "role": "admin" if user.get("is_admin") else "patient"
    })
    return {"message": "Login successful", "token": token, "token_type": "Bearer", "fhir_id": user["fhir_id"]}


@router.get("/check-email")
async def check_patient_exists(email):
    """Check if a patient exists by email."""
    existing_patient = search_patient_by_email(email)
    if existing_patient:
        return {"message": "Patient exists. Please log in.", "exists": True}
    return {"message": "Patient not found. You can register now.", "exists": False}


@router.put("/assign-admin")
async def assign_admin_role(email: str, current_user: dict = Depends(admin_required)):
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
        return {"message": "If an account exists with this email, you will receive password reset instructions."}
    
    # Generate a reset token
    reset_token = secrets.token_urlsafe(32)
    # Token expires in 1 hour
    RESET_TOKEN_EXPIRATION_HOURS = 60
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRATION_HOURS)
    
    # Store the reset token and expiry in MongoDB
    update_reset_token(request.email, reset_token, expires_at)
    
    # TODO: Send email with reset link
    # For now, we'll just return the token (in production, this should be sent via email)
    return {
        "message": "If an account exists with this email, you will receive password reset instructions.",
        "debug_token": reset_token,  # Remove this in production
        "reset_link" : "http://localhost:3000/reset-password?token={reset_token}" # Remove this in production
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

