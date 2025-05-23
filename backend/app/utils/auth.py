import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.config import SECRET_KEY, ALGORITHM
from fastapi import HTTPException, Depends, Path
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from app.models.patient import (
    get_patient as get_patient_from_db,
    search_patient_by_email as get_patient_from_db_by_email,
)


def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = timedelta(hours=1)
):
    """Generate JWT token with subject (email) and role (admin or patient)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str):
    """Verify the JWT token and extract the data."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.JWTError:
        raise Exception("Invalid token")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def set_password(password: str):
    """Hashes the password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    """Verifies the password."""
    return pwd_context.verify(plain_password, hashed_password)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from the JWT token."""
    payload = verify_access_token(token)
    email = payload.get("sub")
    role = payload.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {"email": email, "role": role}


def admin_required(current_user: dict = Depends(get_current_user)):
    """Check if the current user is an admin."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def self_or_admin_required(
    fhir_id: str = Path(...),  # get path param at runtime
    current_user: dict = Depends(get_current_user),
):
    """Check if the current user is an admin or the owner of the resource."""
    patient = get_patient_from_db(fhir_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user["role"] == "admin" or current_user["email"] == patient["email"]:
        return current_user
    raise HTTPException(status_code=403, detail="Not authorized to access this patient")


def get_current_user_with_patient(current_user: dict = Depends(get_current_user)):
    """Get the current user and their patient record if they exist."""
    # For admins, we don't need to fetch patient details
    if current_user["role"] == "admin":
        return current_user, None

    # For patients, get their record
    patient = get_patient_from_db_by_email(current_user["email"])
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    return current_user, patient
