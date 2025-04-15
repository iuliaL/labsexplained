from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import timedelta
from app.services.fhir import create_fhir_patient, delete_fhir_patient, remove_all_observations_for_patient, get_fhir_observations
from app.models.patient import store_patient, Patient, get_patients as get_patients_from_db, get_patient as get_patient_from_db, delete_patient as delete_patient_from_db, search_patient_by_email
from app.models.lab_test_set import get_lab_test_sets_for_patient
from app.utils.auth import create_access_token, admin_required, set_password, self_or_admin_required

router = APIRouter()

# Define the input model for patient registration
class PatientRegister(BaseModel):
    first_name: str
    last_name: str
    birth_date: str
    gender: Literal["male", "female", "other", "unknown"]
    email: str
    password: str  # Password will be hashed
    is_admin: Optional[bool] = False  # Default to False if not provided

@router.post("/patients")
async def register_patient(patient: PatientRegister):
    """Registers a new patient in the FHIR system and stores their FHIR ID in MongoDB or errors if patient already existing"""
    # First, check if the patient exists by email
    existing_patient = search_patient_by_email(patient.email)
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient already exists.")
    
    # Call the external FHIR service to create the patient and retrieve their FHIR ID
    fhir_created_id = create_fhir_patient(
        patient.first_name,
        patient.last_name,
        patient.birth_date,
        patient.gender,
    )
    if not fhir_created_id:
        raise HTTPException(status_code=500, detail="Failed to register patient with FHIR server.")

     # Hash the patient's password before saving
    hashed_password = set_password(patient.password)
    # Create a Pydantic Patient model instance from the data
    new_patient_data = Patient(
        first_name=patient.first_name,
        last_name=patient.last_name,
        birth_date=patient.birth_date,
        gender=patient.gender,
        fhir_id=fhir_created_id,
        email=patient.email,
        password=hashed_password,
        is_admin=patient.is_admin
    )
    # Store the patient in MongoDB, now with a FHIR ID and check the insertion
    try:
        store_patient(new_patient_data)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
    # Generate a JWT token for the patient that expires in 1 hour
    ACCESS_TOKEN_EXPIRATION_HOURS = 1
    token = create_access_token(data={"sub": patient.email, "role": "admin" if patient.is_admin else "patient"},
                                expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRATION_HOURS))

    return {
        "message": "Patient registered successfully",
        "token": token,
        "fhir_id": fhir_created_id
    }
    


@router.get("/patients")
async def get_patients(page: Optional[int] = 1,
                       page_size: Optional[int] = 10,
                       current_user: dict = Depends(admin_required)
                       ):
    """
    Retrieves paginated patients from MongoDB.
    
    Args:
        page (int): The page number (1-based indexing)
        page_size (int): Number of items per page
    """
    # Input validation
    if page < 1:
        raise HTTPException(status_code=400, detail="Page number must be greater than 0")
    if page_size < 1:
        raise HTTPException(status_code=400, detail="Page size must be greater than 0")
    
    patients = get_patients_from_db()
    if not patients:
        return {
            "message": "No patients found",
            "patients": [],
            "pagination": {
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0
            }
        }
    
    # Convert patients to list if it's a cursor
    patients_list = list(patients)
    total_patients = len(patients_list)
    total_pages = (total_patients + page_size - 1) // page_size
    
    # Calculate slice indices
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    # Slice the patients list for the current page
    current_page_patients = patients_list[start_idx:end_idx]
    
    # Format patients for the current page
    formatted_patients = []
    
    for patient in current_page_patients:
        patient_dict = dict(patient)
        patient_dict.pop('_id', None)
        patient_dict.pop('password', None)  # ✅ safely removes if it exists
        
        # Get lab test sets for this patient
        lab_test_sets = get_lab_test_sets_for_patient(patient_dict['fhir_id'])
        
        # Count total lab sets and interpreted sets
        total_lab_sets = len(lab_test_sets)
        interpreted_sets = sum(1 for test_set in lab_test_sets if test_set.get('interpretation'))
        
        patient_dict['lab_test_count'] = total_lab_sets
        patient_dict['interpreted_count'] = interpreted_sets
        
        formatted_patients.append(patient_dict)
    
    return {
        "message": "Patients retrieved",
        "patients": formatted_patients,
        "pagination": {
            "total": total_patients,
            "page": page,
            "page_size": page_size, 
            "total_pages": total_pages
        }
    }

@router.get("/patients/{fhir_id}")
async def get_patient(fhir_id: str,
                    include_observations: bool = False,
                    patient: dict = Depends(self_or_admin_required)
                      ):
    """
    Retrieves the patient from MongoDB using the FHIR ID.
    If include_observations=True, includes all lab test sets with their FHIR observations.
    """
    patient = get_patient_from_db(fhir_id)
    if patient:
        patient_dict = dict(patient)
        patient_dict.pop('_id', None)
        patient_dict.pop('password', None)
        
        if include_observations:
            # Get all lab test sets for the patient
            
            lab_test_sets = get_lab_test_sets_for_patient(fhir_id)
            
            # Include full observation details for each lab test set
            for test_set in lab_test_sets:
                observations = get_fhir_observations(test_set["observation_ids"])
                test_set["observations"] = observations
            
            patient_dict["lab_test_sets"] = lab_test_sets
        
        return {"message": "Patient found", "patient": patient_dict}
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.delete("/patients/{fhir_id}")
async def delete_patient(fhir_id: str, current_user: dict = Depends(admin_required)):
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
