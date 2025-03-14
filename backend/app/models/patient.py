from pymongo import MongoClient
from typing import Literal
from app.config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.medical_dashboard
patients_collection = db["patients"]

# MongoDB Patient Schema
patient_schema = {
    "first_name": str,
    "last_name": str,
    "birth_date": str,
    "gender": str,
    "fhir_id": str
}

VALID_GENDER_VALUES = Literal["male", "female", "other", "unknown"]

def store_patient(first_name:str, last_name: str, birth_date: str, gender: VALID_GENDER_VALUES, fhir_id: str):
    """Stores the patient in MongoDB, ensuring gender validation."""
    if gender not in ["male", "female", "other", "unknown"]:
        raise ValueError(f"Invalid gender. Allowed values: male, female, other, unknown.")

    patient = {
        "first_name": first_name, 
        "last_name": last_name, 
        "birth_date": birth_date, 
        "gender": gender, 
        "fhir_id": fhir_id
    }

    patients_collection.insert_one(patient)
    return patient


def get_patient(fhir_id):
    """Retrieves patient from MongoDB by fhir_id"""
    return patients_collection.find_one({"fhir_id": fhir_id})

def search_patient(first_name, last_name):
    """Retrieves patient from MongoDB by first and lastname"""
    return patients_collection.find_one({"first_name": first_name, "last_name": last_name})

def delete_patient(fhir_id):
    """Deletes a patient from MongoDB"""
    patients_collection.delete_one({"fhir_id": fhir_id})
