from fastapi import HTTPException, Depends
from app.models.patient import search_patient_by_email, verify_password, assign_admin
from backend.app.utils.auth import create_access_token
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.utils.auth import admin_required

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
    return {"message": "Login successful", "token": token, "token_type": "Bearer"}


@router.put("/assign-admin/{email}")
async def assign_admin_role(email: str, current_user: dict = Depends(admin_required)):
    assign_admin(email)
    return {"message": f"{email} is now an admin"}

