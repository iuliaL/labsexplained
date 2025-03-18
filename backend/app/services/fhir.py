import requests
import json
from app.config import FHIR_SERVER_URL
from app.models.patient import store_patient
from app.utils.file_parser import parse_reference_range

VALID_GENDER_VALUES = ["male", "female", "other", "unknown"]

def create_fhir_patient(first_name: str, last_name: str, birth_date: str, gender: str):
    """Creates a new patient in FHIR and stores the FHIR ID in MongoDB"""
    if gender.lower() not in VALID_GENDER_VALUES:
        raise ValueError(f"Invalid gender. Allowed values: {', '.join(VALID_GENDER_VALUES)}")
    
    patient_resource = {
        "resourceType": "Patient",
        "name": [{"use": "official", "family": last_name, "given": [first_name]}],
        "birthDate": birth_date,
        "gender": gender.lower()
    }
    response = requests.post(f"{FHIR_SERVER_URL}/Patient", json=patient_resource)
    
    if response.status_code == 201:
        fhir_id = response.json()["id"]
        return store_patient(first_name, last_name, birth_date, gender.lower(), fhir_id,)
    return None


def delete_fhir_patient(fhir_id: str):
    """Deletes a patient from the FHIR server and handles already deleted cases"""
    response = requests.delete(f"{FHIR_SERVER_URL}/Patient/{fhir_id}")
    # print("FHIR DELETE Response:", response.status_code, response.text)  # ✅ Debugging output
    if response.status_code in [204, 410]:  # ✅ Treat "HTTP 410 Gone" as a successful deletion
        return True
    
    if response.status_code == 200:  
        response_json = response.json()
        if "SUCCESSFUL_DELETE_ALREADY_DELETED" in str(response_json):
            return True  

    return False  # ❌ Treat other failures as errors


def send_lab_results_to_fhir(lab_tests: list, patient_fhir_id: str, date: str):
    headers = {"Content-Type": "application/fhir+json"}
    fhir_observations = []

    for test in lab_tests:
        reference_range = parse_reference_range(test["reference_range"], test["unit"])
        
        observation_resource = {
            # Specifies the type of FHIR resource being created, in this case, an Observation.
            "resourceType": "Observation",
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "laboratory"
                }]
            }],
            "code": {"text": test["name"]},
            "subject": {"reference": f"Patient/{patient_fhir_id}"},
            "effectiveDateTime": date,
            "valueQuantity": {
                "value": test["value"],
                "unit": test["unit"]
            },
        }

        # ✅ Only add reference range if it's valid
        if reference_range:
            observation_resource["referenceRange"] = [reference_range]

        fhir_observations.append(observation_resource)

    # ✅ Debug: Print observations before sending
    print("🔍 Observations being sent to FHIR:", json.dumps(fhir_observations, indent=2))

    # Send each Observation to the FHIR server
    responses = []
    for obs in fhir_observations:
        response = requests.post(f"{FHIR_SERVER_URL}/Observation", headers=headers, data=json.dumps(obs))
        # ✅ Print actual FHIR response
        print("🔍 FHIR Response:", response.status_code, response.text)
        try:
            response_json = response.json()
            responses.append(response_json)
        except json.JSONDecodeError:
            responses.append({"error": "Invalid JSON response from FHIR"})

    return responses



def get_fhir_observations(observation_ids: list):
    """
    Fetches full Observation details from the FHIR server using IDs.

    Args:
        observation_ids (list): List of Observation IDs.

    Returns:
        list: List of full Observation resources.
    """
    full_observations = []

    for obs_id in observation_ids:
        response = requests.get(f"{FHIR_SERVER_URL}/Observation/{obs_id}")

        if response.status_code == 200:
            full_observations.append(response.json())
        else:
            full_observations.append({"error": f"Observation {obs_id} not found in FHIR."})

    return full_observations

    

def remove_fhir_observation(observation_id: str):
    """
    Deletes a specific Observation from the FHIR server.
    
    Args:
        observation_id (str): The FHIR ID of the Observation to delete.
    
    Returns:
        dict: FHIR server response.
    """
    response = requests.delete(f"{FHIR_SERVER_URL}/Observation/{observation_id}")
    print("🔍 FHIR Response:", response.status_code, response.text)


    if response.status_code in [200, 204, 410]:  # ✅ 410 means already deleted
        return {"message": f"Observation {observation_id} deleted successfully."}

    # ✅ Check for Lucene indexing error (more general detection)
    if "Indexing failure" in response.text or "HSEARCH700124" in response.text:
        return {
            "message": f"Observation {observation_id} deleted successfully, but FHIR indexing failed.",
            "warning": "This is an issue with the HAPI FHIR public server, not your API."
        }

    # ❌ If another unexpected error occurs, return the full response
    return {"error": f"Failed to delete Observation {observation_id}. Response: {response.text}"}


def remove_all_observations_for_patient(patient_fhir_id: str):
    """
    Deletes all Observations linked to a specific patient in FHIR.

    Args:
        patient_fhir_id (str): The FHIR ID of the patient.

    Returns:
        dict: Summary of deleted observations.
    """
    # Step 1: Search for all Observations linked to the patient
    search_response = requests.get(f"{FHIR_SERVER_URL}/Observation?subject=Patient/{patient_fhir_id}")

    if search_response.status_code != 200:
        return {"error": f"Failed to retrieve Observations for Patient {patient_fhir_id}. Response: {search_response.text}"}

    observations = search_response.json().get("entry", [])

    if not observations:  # ✅ Correctly return if no observations were found
        return {"message": f"No Observations found for Patient {patient_fhir_id}."}

    # Step 2: Delete each found Observation
    deleted_observations = []
    indexing_warnings = []
    
    for obs in observations:
        obs_id = obs["resource"]["id"]
        delete_response = requests.delete(f"{FHIR_SERVER_URL}/Observation/{obs_id}")

        if delete_response.status_code in [200, 204, 410]:  # ✅ Treat "already deleted" as success
            deleted_observations.append(obs_id)
        elif "Indexing failure" in delete_response.text or "HSEARCH700124" in delete_response.text:
            # ✅ Handle HAPI FHIR's Lucene indexing issue gracefully
            deleted_observations.append(obs_id)
            indexing_warnings.append(f"Observation {obs_id} deleted, but FHIR indexing failed.")
        else:
            indexing_warnings.append(f"Failed to delete Observation {obs_id}. Response: {delete_response.text}")

    # ✅ Format the response with all successful and failed deletions
    response_data = {
        "message": f"Deleted {len(deleted_observations)} observations for Patient {patient_fhir_id}.",
        "deleted": deleted_observations
    }

    if indexing_warnings:
        response_data["warnings"] = indexing_warnings

    return response_data






