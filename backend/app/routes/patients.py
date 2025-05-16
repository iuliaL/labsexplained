from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import timedelta
from app.services.fhir import (
    create_fhir_patient,
    delete_fhir_patient,
    remove_all_observations_for_patient,
    get_fhir_observations,
    update_fhir_patient,
)
from app.models.patient import (
    store_patient,
    Patient,
    Gender,
    get_patients as get_patients_from_db,
    get_patient as get_patient_from_db,
    delete_patient as delete_patient_from_db,
    search_patient_by_email,
    update_patient as update_patient_in_db,
)
from app.models.lab_test_set import (
    get_lab_test_sets_for_patient,
    remove_lab_test_set,
)
from app.utils.auth import admin_required, set_password, self_or_admin_required

router = APIRouter()


# Define the input model for patient registration
class PatientRegister(BaseModel):
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
    try:
        fhir_created_id = create_fhir_patient(patient.email)
    except HTTPException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=f"Failed to register patient with FHIR server. ({e.status_code}): {e.detail}",
        )

    # Hash the patient's password before saving
    hashed_password = set_password(patient.password)
    # Create a Pydantic Patient model instance from the data
    new_patient_data = Patient(
        fhir_id=fhir_created_id,
        email=patient.email,
        password=hashed_password,
        is_admin=patient.is_admin,
    )
    # Store the patient in MongoDB, now with a FHIR ID and check the insertion
    try:
        store_patient(new_patient_data)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

    return {"message": "Patient registered successfully", "fhir_id": fhir_created_id}


@router.get("/patients")
async def get_patients(
    page: Optional[int] = 1,
    page_size: Optional[int] = 10,
    current_user: dict = Depends(admin_required),
):
    """
    Retrieves paginated patients from MongoDB.

    Args:
        page (int): The page number (1-based indexing)
        page_size (int): Number of items per page
    """
    # Input validation
    if page < 1:
        raise HTTPException(
            status_code=400, detail="Page number must be greater than 0"
        )
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
                "total_pages": 0,
            },
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
        patient_dict.pop("_id", None)
        patient_dict.pop("password", None)  # ✅ safely removes if it exists

        # Get lab test sets for this patient
        lab_test_sets = get_lab_test_sets_for_patient(patient_dict["fhir_id"])

        # Count total lab sets and interpreted sets
        total_lab_sets = len(lab_test_sets)
        interpreted_sets = sum(
            1 for test_set in lab_test_sets if test_set.get("interpretation")
        )

        patient_dict["lab_set_count"] = total_lab_sets
        patient_dict["interpreted_count"] = interpreted_sets

        formatted_patients.append(patient_dict)

    return {
        "message": "Patients retrieved",
        "patients": formatted_patients,
        "pagination": {
            "total": total_patients,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        },
    }


@router.get("/patients/{fhir_id}")
async def get_patient(
    fhir_id: str,
    include_observations: bool = False,
    patient: dict = Depends(self_or_admin_required),
):
    """
    Retrieves the patient from MongoDB using the FHIR ID.
    If include_observations=True, includes all lab test sets with their FHIR observations.
    """
    patient = get_patient_from_db(fhir_id)
    if patient:
        patient_dict = dict(patient)
        patient_dict.pop("_id", None)
        patient_dict.pop("password", None)

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
    patient = get_patient_from_db(fhir_id)

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Prevent admin from deleting themselves
    if patient["email"] == current_user["email"]:
        raise HTTPException(
            status_code=403, detail="You cannot delete your own account"
        )

    # First delete all observations for this patient
    obs_result = remove_all_observations_for_patient(fhir_id)
    if "error" in obs_result:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete patient's observations: {obs_result['error']}",
        )

    # Now delete patient from FHIR
    fhir_response = delete_fhir_patient(fhir_id)
    if fhir_response is False:
        raise HTTPException(
            status_code=500, detail="Failed to delete patient from FHIR"
        )

    # Delete all lab test sets for this patient
    lab_test_sets = get_lab_test_sets_for_patient(fhir_id)
    for lab_test_set in lab_test_sets:
        remove_lab_test_set(lab_test_set["id"])

    # Finally delete patient from MongoDB
    delete_patient_from_db(fhir_id)

    return {
        "message": "Patient and all associated data deleted successfully",
        "fhir_id": fhir_id,
    }


# Define model for patient information updates
class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[Gender] = None


@router.put("/patients/{fhir_id}")
async def update_patient(
    fhir_id: str,
    patient_update: PatientUpdate,
    current_user: dict = Depends(self_or_admin_required),
):
    """Update patient information (name, birth date, gender) in both FHIR and MongoDB. Only provided fields will be updated."""
    try:
        # Filter out None values to only update provided fields
        update_data = {
            k: v for k, v in patient_update.model_dump().items() if v is not None
        }

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update provided")

        print(
            f"Attempting to update FHIR patient {fhir_id} with data: {update_data}"
        )  # Debug log

        try:
            # First update FHIR
            fhir_updated = update_fhir_patient(fhir_id=fhir_id, **update_data)
        except Exception as e:
            print(f"FHIR update failed: {str(e)}")  # Debug log
            raise HTTPException(
                status_code=500, detail=f"Failed to update patient in FHIR: {str(e)}"
            )

        if fhir_updated:
            try:
                # Then update MongoDB with just the fields that were provided
                mongo_updated = update_patient_in_db(
                    fhir_id=fhir_id, update_data=update_data
                )
                if mongo_updated:
                    return {"message": "Patient updated successfully"}
                else:
                    raise HTTPException(status_code=500, detail="MongoDB update failed")
            except Exception as e:
                print(f"MongoDB update failed: {str(e)}")  # Debug log
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update patient in MongoDB: {str(e)}",
                )

        raise HTTPException(status_code=500, detail="FHIR update failed")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error in update_patient: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500, detail=f"Unexpected error while updating patient: {str(e)}"
        )
