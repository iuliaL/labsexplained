from fastapi import HTTPException
from app.models.patient import search_patient_by_email, verify_password
from app.utils.jwt import create_access_token
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(credentials: LoginInput):
    # Search for patient by email
    patient = search_patient_by_email(credentials.email)
    if not patient:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify the password
    if not verify_password(credentials.password, patient["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    token = create_access_token(data={"sub": credentials.email})
    return {"message": "Login successful", "token": token}
