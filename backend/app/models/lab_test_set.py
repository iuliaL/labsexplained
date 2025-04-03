from pymongo import MongoClient
from app.config import MONGO_URI
from app.models.patient import get_patient
from bson import ObjectId 

client = MongoClient(MONGO_URI)
db = client.medical_dashboard
lab_test_sets_collection = db["lab_test_sets"]

# MongoDB Lab Test Set Schema
lab_test_set_schema = {
    "patient_fhir_id": str,  # Links to the patient
    "test_date": str,  # Date of the test set,
    "birth_date": str,  # Patient's birth date for context
    "gender": str,  # Patient's gender for context
    "observation_ids": list,  # Store only FHIR Observation IDs
    "interpretation": str # AI summary
}

def store_lab_test_set(patient_fhir_id: str, test_date: str, observation_ids: list):
    """
    Stores a new lab test set in MongoDB with only FHIR Observation IDs.

    Args:
        patient_fhir_id (str): The FHIR ID of the patient.
        test_date (str): The date the tests were performed.
        observation_ids (list): List of Observation IDs stored in FHIR.

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
    lab_test_set = {
        "patient_fhir_id": patient_fhir_id,
        "test_date": test_date,
        "birth_date": birth_date,
        "gender": gender,
        "observation_ids": observation_ids,  # Store only FHIR IDs
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
        list: A list of lab test sets.
    """
    lab_test_sets = list(lab_test_sets_collection.find({"patient_fhir_id": patient_fhir_id}))

    # Convert ObjectId to string and remove _id field
    formatted_sets = []
    for test_set in lab_test_sets:
        formatted_set = {
            "id": str(test_set["_id"]),
            "patient_fhir_id": test_set["patient_fhir_id"],
            "test_date": test_set["test_date"],
            "observation_ids": test_set["observation_ids"],
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
        object_id = ObjectId(lab_test_set_id)  # ✅ Convert to ObjectId
    except Exception:
        return None  # Return None if it's not a valid ObjectId

    return lab_test_sets_collection.find_one({"_id": object_id})


def remove_lab_test_set(lab_test_set_id: str):
    """
    Deletes a lab test set from MongoDB.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.

    Returns:
        dict: Deletion result.
    """
    try:
        # Convert lab_test_set_id to ObjectId
        object_id = ObjectId(lab_test_set_id)
    except Exception:
        return {"error": "Invalid lab test set ID format."}

    result = lab_test_sets_collection.delete_one({"_id": object_id})

    if result.deleted_count:
        return {"message": f"Lab test set {lab_test_set_id} deleted successfully."}

    return {"error": "Lab test set not found."}


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
        return get_lab_test_set_by_id(lab_test_set_id)

    return {"error": "Lab test set not found."}



