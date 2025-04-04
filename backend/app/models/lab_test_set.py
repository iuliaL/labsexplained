from typing import Optional, List, Dict
from bson import ObjectId
from pymongo import MongoClient
from app.config import MONGO_URI
from app.models.patient import get_patient


client = MongoClient(MONGO_URI)
db = client.medical_dashboard
lab_test_sets_collection = db["lab_test_sets"]

# MongoDB Lab Test Set Schema
lab_test_set_schema = {
    "patient_fhir_id": str,  # Links to the patient,
    "birth_date": str,  # Patient's birth date for context
    "gender": str,  # Patient's gender for context
    "test_date": str,  # Date of the test set
    "observations": list,  # Store both FHIR Observation IDs and test names
    "interpretation": str  # AI summary
}

def store_lab_test_set(patient_fhir_id: str, test_date: str, observations: list):
    """
    Stores a new lab test set in MongoDB with FHIR Observation IDs and test names.

    Args:
        patient_fhir_id (str): The FHIR ID of the patient.
        test_date (str): The date the tests were performed.
        observations (list): List of Observation resources from FHIR.

    Returns:
        dict: The saved lab test set.
    """
    # ✅ Fetch patient details directly from MongoDB
    patient_details = get_patient(patient_fhir_id)

    if not patient_details:
        return {"error": "Patient not found in MongoDB."}

    # ✅ Extract birth date & gender from the patient record
    birth_date = patient_details.get("birth_date", "Unknown")
    gender = patient_details.get("gender", "Unknown")

    # Extract observation IDs and names
    observation_data = []
    for obs in observations:
        if "id" in obs and "code" in obs and "text" in obs["code"]:
            observation_data.append({
                "id": obs["id"],
                "name": obs["code"]["text"]
            })

    lab_test_set = {
        "patient_fhir_id": patient_fhir_id,
        "test_date": test_date,
        "birth_date": birth_date,
        "gender": gender,
        "observations": observation_data,  # Store both IDs and names
        "interpretation": None  # Placeholder for future AI summary
    }

    result = lab_test_sets_collection.insert_one(lab_test_set)
    lab_test_set["id"] = str(result.inserted_id)
    return lab_test_set

def get_lab_test_sets_for_patient(patient_fhir_id: str):
    """
    Retrieves all lab test sets for a patient from MongoDB.

    Args:
        patient_fhir_id (str): The FHIR ID of the patient.

    Returns:
        list: A list of lab test sets with observation IDs and names.
    """
    lab_test_sets = list(lab_test_sets_collection.find({"patient_fhir_id": patient_fhir_id}))
    
    # Convert ObjectId to string and remove _id field
    formatted_sets = []
    for test_set in lab_test_sets:
        formatted_set = {
            "id": str(test_set["_id"]),
            "patient_fhir_id": test_set["patient_fhir_id"],
            "test_date": test_set["test_date"],
            "observations": test_set.get("observations", []),
            "birth_date": test_set.get("birth_date", "Unknown"),
            "gender": test_set.get("gender", "Unknown"),
            "interpretation": test_set.get("interpretation")
        }
        formatted_sets.append(formatted_set)
    
    return formatted_sets

def get_lab_test_set_by_id(lab_test_set_id: str):
    """
    Retrieves a specific lab test set from MongoDB using its _id.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.

    Returns:
        dict or None: The lab test set if found, else None.
    """
    try:
        object_id = ObjectId(lab_test_set_id)  # Convert to ObjectId
    except Exception:
        return None  # Return None if it's not a valid ObjectId

    test_set = lab_test_sets_collection.find_one({"_id": object_id})
    if test_set:
        test_set["id"] = str(test_set["_id"])
        del test_set["_id"]
    return test_set

def update_lab_test_set(lab_test_set_id: str, update_data: dict):
    """
    Updates a lab test set in MongoDB with new data.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.
        update_data (dict): Dictionary containing the fields to update.

    Returns:
        dict: The updated lab test set.
    """
    try:
        object_id = ObjectId(lab_test_set_id)
    except Exception:
        return {"error": "Invalid lab test set ID format."}

    result = lab_test_sets_collection.update_one({"_id": object_id}, {"$set": update_data})

    if result.matched_count:
        return {"message": "Lab test set updated successfully."}
    return {"error": "Lab test set not found."}

def remove_lab_test_set(lab_test_set_id: str):
    """
    Deletes a lab test set from MongoDB.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.

    Returns:
        dict: Deletion result.
    """
    try:
        object_id = ObjectId(lab_test_set_id)
    except Exception:
        return {"error": "Invalid lab test set ID format."}

    result = lab_test_sets_collection.delete_one({"_id": object_id})

    if result.deleted_count:
        return {"message": f"Lab test set {lab_test_set_id} deleted successfully."}
    return {"error": "Lab test set not found."}



