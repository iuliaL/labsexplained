from pymongo import MongoClient
from typing import Literal
from app.config import MONGO_URI
from pydantic import BaseModel
from enum import Enum
from passlib.context import CryptContext
from fastapi import HTTPException


client = MongoClient(MONGO_URI)
db = client.medical_dashboard
patients_collection = db["patients"]

class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"
    unknown = "unknown"


# MongoDB Patient Schema
class Patient(BaseModel):
    first_name: str
    last_name: str
    birth_date: str
    gender: Gender
    fhir_id: str
    email: str = None
    password: str
    is_admin: bool = False

    class Config: 
        # MongoDB stores data in camelCase, but we want snake_case in the code
        alias_generator = lambda string: string.lower()      

def store_patient(patient: Patient):
    """Stores the patient in MongoDB, ensuring gender validation."""
    # Convert Pydantic model to dictionary for MongoDB
    patient_dict = patient.model_dump(by_alias=True)
    result = patients_collection.insert_one(patient_dict)

    # Check if the insert was acknowledged
    if not result.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to insert patient into the database.")
    return patient

def get_patients():
    """Retrieves patients from MongoDB"""
    return patients_collection.find()

def get_patient(fhir_id):
    """Retrieves patient from MongoDB by fhir_id"""
    return patients_collection.find_one({"fhir_id": fhir_id})

def search_patient(first_name, last_name):
    """Retrieves patient from MongoDB by first and lastname"""
    return patients_collection.find_one({"first_name": first_name, "last_name": last_name})

def search_patient_by_email(email: str):
    """Retrieves patient from MongoDB by email."""
    return patients_collection.find_one({"email": email})

def delete_patient(fhir_id):
    """Deletes a patient from MongoDB"""
    patients_collection.delete_one({"fhir_id": fhir_id})


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def set_password(password: str):
    """Hashes the password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Verifies the password."""
    return pwd_context.verify(plain_password, hashed_password)

