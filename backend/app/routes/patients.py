from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.services.fhir import create_fhir_patient, delete_fhir_patient, remove_all_observations_for_patient
from app.models.patient import search_patient, get_patients as get_patients_from_db, get_patient as get_patient_from_db, delete_patient as delete_patient_from_db

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

@router.get("/patients")
async def get_patients():
    """Retrieves the patient from MongoDB using the FHIR ID"""
    patients = get_patients_from_db()
    if patients:
        # Convert ObjectId to string and return as id
        formatted_patients = []
        from app.models.lab_test_set import get_lab_test_sets_for_patient
        
        for patient in patients:
            patient_dict = dict(patient)
            patient_dict['id'] = str(patient_dict.pop('_id'))
            
            # Get lab test sets for this patient
            lab_test_sets = get_lab_test_sets_for_patient(patient_dict['fhir_id'])
            
            # Count total lab sets and interpreted sets
            total_lab_sets = len(lab_test_sets)
            interpreted_sets = sum(1 for test_set in lab_test_sets if test_set.get('interpretation'))
            
            patient_dict['lab_test_count'] = total_lab_sets
            patient_dict['interpreted_count'] = interpreted_sets
            
            formatted_patients.append(patient_dict)
            
        return {"message": "Patients retrieved", "patients": formatted_patients}
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.get("/patients/{fhir_id}")
async def get_patient(fhir_id: str, include_observations: bool = False):
    """
    Retrieves the patient from MongoDB using the FHIR ID.
    If include_observations=True, includes all lab test sets with their FHIR observations.
    """
    patient = get_patient_from_db(fhir_id)
    if patient:
        # Convert ObjectId to string and return as id
        patient_dict = dict(patient)
        patient_dict['id'] = str(patient_dict.pop('_id'))
        
        if include_observations:
            # Get all lab test sets for the patient
            from app.models.lab_test_set import get_lab_test_sets_for_patient
            from app.services.fhir import get_fhir_observations
            
            lab_test_sets = get_lab_test_sets_for_patient(fhir_id)
            
            # Include full observation details for each lab test set
            for test_set in lab_test_sets:
                observations = get_fhir_observations(test_set["observation_ids"])
                test_set["observations"] = observations
            
            patient_dict["lab_test_sets"] = lab_test_sets
        
        return {"message": "Patient found", "patient": patient_dict}
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.delete("/patients/{fhir_id}")
async def delete_patient(fhir_id: str):
    """Deletes a patient from both MongoDB and the FHIR server"""
    patient = get_patient(fhir_id)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # First delete all observations for this patient
    obs_result = remove_all_observations_for_patient(fhir_id)
    if "error" in obs_result:
        raise HTTPException(status_code=500, detail=f"Failed to delete patient's observations: {obs_result['error']}")

    # Now delete patient from FHIR
    fhir_response = delete_fhir_patient(fhir_id)
    if fhir_response is False:
        raise HTTPException(status_code=500, detail="Failed to delete patient from FHIR")

    # Finally delete patient from MongoDB
    delete_patient_from_db(fhir_id)

    return {"message": "Patient and all associated data deleted successfully", "fhir_id": fhir_id}
