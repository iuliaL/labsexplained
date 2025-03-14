from pymongo import MongoClient
from app.config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.medical_dashboard
lab_test_sets_collection = db["lab_test_sets"]

# MongoDB Lab Test Set Schema
lab_test_set_schema = {
    "patient_fhir_id": str,  # Links to the patient
    "test_date": str,  # Date of the test set
    "observation_ids": list,  # Store only FHIR Observation IDs
    "gpt_interpretation": str
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
    lab_test_set = {
        "patient_fhir_id": patient_fhir_id,
        "test_date": test_date,
        "observation_ids": observation_ids,  # Store only FHIR IDs
        "gpt_interpretation": None  # Placeholder for future AI summary
    }

    result = lab_test_sets_collection.insert_one(lab_test_set)
    lab_test_set["_id"] = str(result.inserted_id)
    return lab_test_set



def get_lab_test_sets_for_patient(patient_fhir_id: str):
    """
    Retrieves all lab test sets for a patient from MongoDB.

    Args:
        patient_fhir_id (str): The FHIR ID of the patient.

    Returns:
        list: A list of lab test sets.
    """
    return list(lab_test_sets_collection.find({"patient_fhir_id": patient_fhir_id}, {"_id": 0}))


def delete_lab_test_set(lab_test_set_id: str):
    """
    Deletes a lab test set from MongoDB.

    Args:
        lab_test_set_id (str): The MongoDB ID of the lab test set.

    Returns:
        dict: Deletion result.
    """
    result = lab_test_sets_collection.delete_one({"_id": lab_test_set_id})
    if result.deleted_count:
        return {"message": f"Lab test set {lab_test_set_id} deleted successfully."}
    return {"error": "Lab test set not found."}

