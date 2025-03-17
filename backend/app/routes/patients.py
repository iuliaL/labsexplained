from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.services.fhir import create_fhir_patient, delete_fhir_patient
from app.models.patient import search_patient, get_patient as get_patient_from_db, delete_patient as delete_patient_from_db

router = APIRouter()

# Define the input model for patient registration
class PatientInput(BaseModel):
    first_name: str
    last_name: str
    birth_date: str
    gender: Literal["male", "female", "other", "unknown"]



@router.post("/patients")
async def register_patient(patient: PatientInput):
    """Registers a new patient in the FHIR system and stores their FHIR ID in MongoDB or retrieves the patient if already existing"""
    existing_patient = search_patient(patient.first_name, patient.last_name)
    if existing_patient:
        return {"message": "Patient already registered", "fhir_id": existing_patient["fhir_id"]}

    new_patient = create_fhir_patient(patient.first_name, patient.last_name, patient.birth_date, patient.gender)
    if new_patient:
        return {"message": "Patient registered successfully", "fhir_id": new_patient["fhir_id"]}
    
    raise HTTPException(status_code=500, detail="Failed to register patient")

@router.get("/patients/{fhir_id}")
async def get_patient(fhir_id: str):
    """Retrieves the patient from MongoDB using the FHIR ID"""
    patient = get_patient_from_db(fhir_id)
    if patient:
        # Convert ObjectId to string before returning
        patient["_id"] = str(patient["_id"])
        return {"message": "Patient found", "patient": patient}
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.delete("/patients/{fhir_id}")
async def delete_patient(fhir_id: str):
    """Deletes a patient from both MongoDB and the FHIR server"""
    patient = get_patient(fhir_id)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Delete patient from FHIR (handles already deleted cases)
    fhir_response = delete_fhir_patient(fhir_id)
    if fhir_response is False:
        raise HTTPException(status_code=500, detail="Failed to delete patient from FHIR")

    # Delete patient from MongoDB
    delete_patient_from_db(fhir_id)

    return {"message": "Patient deleted successfully", "fhir_id": fhir_id}
