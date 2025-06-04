from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from datetime import datetime
from typing import Optional
from app.utils.auth import self_or_admin_required, get_current_user_with_patient
from app.services.fhir import (
    send_lab_results_to_fhir,
    remove_all_observations_for_patient,
    remove_fhir_observation,
    get_fhir_observations,
    get_fhir_observation,
)
from app.utils.file_parser import extract_text
from app.services.openai import extract_lab_results_with_gpt, interpret_full_lab_set
from app.models.lab_test_set import (
    get_lab_test_sets_for_patient,
    remove_lab_test_set,
    store_lab_test_set,
    get_lab_test_set_by_id,
    update_lab_test_set,
)

# Constants
MAX_FILE_SIZE = 1024 * 1024  # 1MB in bytes
ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]

router = APIRouter()


@router.get(
    "/lab_set/{fhir_id}"
)  # this refers to the patient's FHIR ID not the lab set id
async def get_all_patient_lab_sets(
    fhir_id: str,
    include_observations: bool = False,
    page: Optional[int] = 1,
    page_size: Optional[int] = 5,
    auth: tuple[dict, dict | None] = Depends(get_current_user_with_patient),
):
    """
    Retrieves all lab test sets for a specific patient with pagination.
    Lab sets are sorted by test date in descending order (newest first).
    Only admins or the patient themselves can access their lab sets.

    Args:
        fhir_id (str): The patient's FHIR ID
        include_observations (bool): If True, fetches full observation details from FHIR
        page (int): The page number (1-based)
        page_size (int): Number of items per page
        auth: Tuple of (current_user, patient) from authentication
    """
    if page < 1:
        raise HTTPException(
            status_code=400, detail="Page number must be greater than 0"
        )
    if page_size < 1:
        raise HTTPException(status_code=400, detail="Page size must be greater than 0")

    # Get all lab test sets
    all_lab_test_sets = get_lab_test_sets_for_patient(fhir_id)

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
            "total_pages": total_pages,
        },
    }


@router.post("/lab_set")
async def upload_patient_lab_test_set(
    patient_fhir_id: str = Form(...),
    test_date: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Uploads and processes a lab test set for a patient.
    Stores both observation IDs and test names in MongoDB.

    File size limit: 1MB
    Accepted formats: PDF, JPEG, PNG
    """
    try:
        # Validate file type
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type. Allowed types: PDF, JPEG, PNG",
            )

        # Read initial chunk to check file size
        contents = await file.read()
        file_size = len(contents)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size ({file_size / 1024 / 1024:.1f}MB) exceeds maximum allowed size (1MB)",
            )

        # Extract text from the file
        extracted_text = extract_text(file.filename, contents)

        # Extract lab results using GPT
        lab_results = extract_lab_results_with_gpt(extracted_text)

        # Send results to FHIR and get responses
        fhir_responses = send_lab_results_to_fhir(
            lab_results, patient_fhir_id, test_date
        )

        # Store lab test set in MongoDB with full observation data
        lab_test_set = store_lab_test_set(
            patient_fhir_id=patient_fhir_id,
            test_date=test_date,
            observations=fhir_responses,
        )

        # Convert ObjectId to string for JSON response
        lab_test_set["id"] = str(lab_test_set.pop("_id"))

        return lab_test_set

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error in POST /lab_set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/lab_set/{lab_test_set_id}")
async def delete_lab_test_set(
    lab_test_set_id: str,
    auth: tuple[dict, dict | None] = Depends(get_current_user_with_patient),
):
    """
    Deletes a specific lab test set and removes its observations from the FHIR server.
    Only admins or the patient who owns the lab set can delete it.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.
        auth: Tuple of (current_user, patient) from authentication

    Returns:
        dict: Deletion result.

    Raises:
        HTTPException: 404 if not found, 403 if unauthorized
    """
    current_user, patient = auth

    # Retrieve lab test set details to get the observation IDs
    lab_test_set = get_lab_test_set_by_id(lab_test_set_id)

    if not lab_test_set:
        raise HTTPException(status_code=404, detail="Lab test set not found.")

    # Check authorization
    if current_user["role"] != "admin":
        if not patient or patient["fhir_id"] != lab_test_set["patient_fhir_id"]:
            raise HTTPException(
                status_code=403, detail="Not authorized to delete this lab test set"
            )

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
        "failed_observations": failed_observations,
    }


@router.delete("/observations/{observation_id}")
async def delete_observation(
    observation_id: str,
    auth: tuple[dict, dict | None] = Depends(get_current_user_with_patient),
):
    """
    Deletes a specific Observation by its ID.
    Only admins or the patient who owns the observation can delete it.

    Args:
        observation_id (str): The FHIR ID of the observation.
        auth: Tuple of (current_user, patient) from authentication

    Returns:
        dict: The deletion result.

    Raises:
        HTTPException: 404 if observation not found, 403 if unauthorized
    """
    current_user, patient = auth

    try:
        # First get the observation to check ownership
        observation = get_fhir_observation(observation_id)
        if not observation:
            raise HTTPException(status_code=404, detail="Observation not found")

        # Extract patient FHIR ID from the observation's subject reference
        # The reference format is "Patient/fhir_id"
        observation_patient_fhir_id = (
            observation.get("subject", {}).get("reference", "").split("/")[-1]
        )

        if not observation_patient_fhir_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid observation: no patient reference found",
            )

        # For admins, allow deletion of any observation
        if current_user["role"] == "admin":
            result = remove_fhir_observation(observation_id)
            return result

        # For patients, check if the observation belongs to them
        if not patient or patient["fhir_id"] != observation_patient_fhir_id:
            raise HTTPException(
                status_code=403, detail="Not authorized to delete this observation"
            )

        # If authorized, proceed with deletion
        result = remove_fhir_observation(observation_id)
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/observations/patient/{fhir_id}")
async def delete_all_observations_for_patient(
    fhir_id: str, current_user: dict = Depends(self_or_admin_required)
):
    """Deletes all Observations linked to a specific patient."""
    result = remove_all_observations_for_patient(fhir_id)
    return result


@router.post("/lab_set/{lab_test_set_id}/interpret")
def interpret_lab_test_set(
    lab_test_set_id: str,
    auth: tuple[dict, dict | None] = Depends(get_current_user_with_patient),
):
    """
    Generates an AI-based interpretation for the entire lab test set.
    Only admins or the patient who owns the lab set can interpret it.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.
        auth: Tuple of (current_user, patient) from authentication


    Returns:
        dict: Updated lab test set with AI interpretation.
    """
    current_user, patient = auth

    # Retrieve the lab test set
    lab_test_set = get_lab_test_set_by_id(lab_test_set_id)

    if not lab_test_set:
        raise HTTPException(status_code=404, detail="Lab test set not found.")

    # For admins, allow viewing any observation
    if current_user["role"] != "admin":
        if not patient or patient["fhir_id"] != lab_test_set["patient_fhir_id"]:
            raise HTTPException(
                status_code=403, detail="Not authorized to interpret this lab test set"
            )

    # If authorized, proceed with interpretation

    # Retrieve birth date & gender from lab test set
    birth_date = lab_test_set.get("birth_date", "Unknown")
    gender = lab_test_set.get("gender", "Unknown")

    # Get observation IDs from the observations array
    observation_ids = [obs["id"] for obs in lab_test_set.get("observations", [])]

    # Fetch full lab set results from FHIR using the stored observation IDs
    full_lab_tests = get_fhir_observations(observation_ids)

    if not full_lab_tests:
        raise HTTPException(
            status_code=400, detail="No lab test results found in FHIR."
        )

    # Generate AI-based summary using OpenAI
    interpretation = interpret_full_lab_set(full_lab_tests, birth_date, gender)

    # Store the interpretation in MongoDB
    update_result = update_lab_test_set(
        lab_test_set_id, {"interpretation": interpretation}
    )

    if "error" in update_result:
        raise HTTPException(status_code=500, detail=update_result["error"])

    return {
        "message": f"Interpretation added to lab test set {lab_test_set_id}",
        "interpretation": interpretation,
    }


@router.get("/observations/{observation_id}")
async def get_observation(
    observation_id: str,
    auth: tuple[dict, dict | None] = Depends(get_current_user_with_patient),
):
    """
    Retrieves a specific observation from FHIR by its ID.
    Only admins or the patient who owns the observation can view it.

    Args:
        observation_id (str): The FHIR ID of the observation.
        auth: Tuple of (current_user, patient) from authentication

    Returns:
        dict: The observation data.

    Raises:
        HTTPException: 404 if observation not found, 403 if unauthorized
    """
    current_user, patient = auth

    try:
        # Get the observation to check ownership
        observation = get_fhir_observation(observation_id)
        if not observation:
            raise HTTPException(status_code=404, detail="Observation not found")

        # Extract patient FHIR ID from the observation's subject reference
        # The reference format is "Patient/fhir_id"
        observation_patient_fhir_id = (
            observation.get("subject", {}).get("reference", "").split("/")[-1]
        )

        if not observation_patient_fhir_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid observation: no patient reference found",
            )

        # For admins, allow viewing any observation
        if current_user["role"] == "admin":
            return observation

        # For patients, check if the observation belongs to them
        if not patient or patient["fhir_id"] != observation_patient_fhir_id:
            raise HTTPException(
                status_code=403, detail="Not authorized to view this observation"
            )

        # If authorized, return the observation
        return observation

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
