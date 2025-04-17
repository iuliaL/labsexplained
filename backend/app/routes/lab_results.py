from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from datetime import datetime
from typing import Optional
import re
from app.services.fhir import send_lab_results_to_fhir, remove_all_observations_for_patient, remove_fhir_observation, get_fhir_observations
from app.utils.file_parser import extract_text
from app.services.openai import extract_lab_results_with_gpt, interpret_full_lab_set
from app.models.lab_test_set import get_lab_test_sets_for_patient, remove_lab_test_set, store_lab_test_set, get_lab_test_set_by_id, update_lab_test_set


router = APIRouter()

@router.get("/lab_set/{patient_fhir_id}")
async def get_all_patient_lab_sets(
    patient_fhir_id: str, 
    include_observations: bool = False,
    page: Optional[int] = 1,
    page_size: Optional[int] = 5
):
    """
    Retrieves all lab test sets for a specific patient with pagination.
    Lab sets are sorted by test date in descending order (newest first).
    
    Args:
        patient_fhir_id (str): The patient's FHIR ID
        include_observations (bool): If True, fetches full observation details from FHIR
        page (int): The page number (1-based)
        page_size (int): Number of items per page
    """
    if page < 1:
        raise HTTPException(status_code=400, detail="Page number must be greater than 0")
    if page_size < 1:
        raise HTTPException(status_code=400, detail="Page size must be greater than 0")

    # Get all lab test sets
    all_lab_test_sets = get_lab_test_sets_for_patient(patient_fhir_id)
    
    # Sort lab test sets by test date in descending order (newest first)
    all_lab_test_sets.sort(key=lambda x: x["test_date"], reverse=True)
    
    # Calculate pagination
    total_sets = len(all_lab_test_sets)
    total_pages = (total_sets + page_size - 1) // page_size
    
    # Calculate slice indices
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    # Get the current page's lab sets
    current_page_sets = all_lab_test_sets[start_idx:end_idx]

    if include_observations:
        for test_set in current_page_sets:
            observation_ids = [obs["id"] for obs in test_set["observations"]]
            full_observations = get_fhir_observations(observation_ids)
            test_set["full_observations"] = full_observations

    return {
        "lab_test_sets": current_page_sets,
        "pagination": {
            "total": total_sets,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    }


@router.post("/lab_set")
async def upload_patient_lab_test_set(
    patient_fhir_id: str = Form(...),
    test_date: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Uploads and processes a lab test set for a patient.
    Stores both observation IDs and test names in MongoDB.
    """
    try:
        # Read the file content and extract text
        contents = await file.read()
        extracted_text = extract_text(file.filename, contents)

        # Extract lab results using GPT
        lab_results = extract_lab_results_with_gpt(extracted_text)
        
        # Send results to FHIR and get responses
        fhir_responses = send_lab_results_to_fhir(lab_results, patient_fhir_id, test_date)
        
        # Store lab test set in MongoDB with full observation data
        lab_test_set = store_lab_test_set(
            patient_fhir_id=patient_fhir_id,
            test_date=test_date,
            observations=fhir_responses
        )

        # Convert ObjectId to string for JSON response
        lab_test_set["id"] = str(lab_test_set.pop("_id"))
        
        return lab_test_set

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/lab_set/{lab_test_set_id}")
async def delete_lab_test_set(lab_test_set_id: str):
    """
    Deletes a specific lab test set and removes its observations from the FHIR server.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.

    Returns:
        dict: Deletion result.
    """
    # Retrieve lab test set details to get the observation IDs
    lab_test_set = get_lab_test_set_by_id(lab_test_set_id)

    if not lab_test_set:
        raise HTTPException(status_code=404, detail="Lab test set not found.")

    # Extract FHIR observation IDs from the lab test set
    observation_ids = [obs["id"] for obs in lab_test_set.get("observations", [])]

    # Delete observations from FHIR server
    deleted_observations = []
    failed_observations = []

    for obs_id in observation_ids:
        delete_result = remove_fhir_observation(obs_id)
        if "message" in delete_result:
            deleted_observations.append(obs_id)
        else:
            failed_observations.append(delete_result)

    # Now delete the lab test set from MongoDB
    result = remove_lab_test_set(lab_test_set_id)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return {
        "message": f"Lab test set {lab_test_set_id} deleted successfully.",
        "deleted_observations": deleted_observations,
        "failed_observations": failed_observations
    }


    
@router.delete("/observations/{observation_id}")
async def delete_observation(observation_id: str):
    """Deletes a specific Observation by its ID."""
    result = remove_fhir_observation(observation_id)
    return result


@router.delete("/observations/patient/{patient_fhir_id}")
async def delete_all_observations_for_patient(patient_fhir_id: str):
    """Deletes all Observations linked to a specific patient."""
    result = remove_all_observations_for_patient(patient_fhir_id)
    return result


@router.post("/lab_set/{lab_test_set_id}/interpret")
def interpret_lab_test_set(lab_test_set_id: str):
    """
    Generates an AI-based interpretation for the entire lab test set.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.

    Returns:
        dict: Updated lab test set with AI interpretation.
    """
    # Retrieve the lab test set
    lab_test_set = get_lab_test_set_by_id(lab_test_set_id)

    if not lab_test_set:
        raise HTTPException(status_code=404, detail="Lab test set not found.")
     
    # Retrieve birth date & gender from lab test set
    birth_date = lab_test_set.get("birth_date", "Unknown")
    gender = lab_test_set.get("gender", "Unknown")

    # Get observation IDs from the observations array
    observation_ids = [obs["id"] for obs in lab_test_set.get("observations", [])]
    
    # Fetch full lab set results from FHIR using the stored observation IDs
    full_lab_tests = get_fhir_observations(observation_ids)

    if not full_lab_tests:
        raise HTTPException(status_code=400, detail="No lab test results found in FHIR.")

    # Generate AI-based summary using OpenAI
    interpretation = interpret_full_lab_set(full_lab_tests, birth_date, gender)

    # Store the interpretation in MongoDB
    update_result = update_lab_test_set(lab_test_set_id, {"interpretation": interpretation})
    
    if "error" in update_result:
        raise HTTPException(status_code=500, detail=update_result["error"])

    return {
        "message": f"Interpretation added to lab test set {lab_test_set_id}",
        "interpretation": interpretation
    }
    

@router.get("/observations/{observation_id}")
async def get_observation(observation_id: str):
    """
    Retrieves a specific observation from FHIR by its ID.

    Args:
        observation_id (str): The FHIR ID of the observation.

    Returns:
        dict: The observation data.
    """
    try:
        observations = get_fhir_observations([observation_id])
        if not observations:
            raise HTTPException(status_code=404, detail="Observation not found")
        return {"observations": observations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    


