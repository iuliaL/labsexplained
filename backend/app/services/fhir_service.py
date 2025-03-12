import requests
from app.config import FHIR_SERVER_URL
from app.models.patient import store_patient

def create_fhir_patient(first_name, last_name, birth_date):
    """Creates a new patient in FHIR and stores the FHIR ID in MongoDB"""
    patient_resource = {
        "resourceType": "Patient",
        "name": [{"use": "official", "family": last_name, "given": [first_name]}],
        "birthDate": birth_date
    }
    response = requests.post(f"{FHIR_SERVER_URL}/Patient", json=patient_resource)
    
    if response.status_code == 201:
        fhir_id = response.json()["id"]
        return store_patient(first_name, last_name, birth_date, fhir_id)
    return None


def delete_fhir_patient(fhir_id):
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


def send_lab_results_to_fhir(patient_fhir_id: str, lab_tests: list):
    """
    Sends structured lab test results to the FHIR server as Observation resources.

    Args:
        patient_fhir_id (str): The FHIR ID of the patient to associate the observations with.
        lab_tests (list): A list of dictionaries containing lab test results.

    Returns:
        list: A list of FHIR Observation IDs created.
    """
    observation_ids = []

    for test in lab_tests:
        observation_resource = {
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
            "valueQuantity": {
                "value": test["value"],
                "unit": test["unit"]
            }
        }

        response = requests.post(f"{FHIR_SERVER_URL}/Observation", json=observation_resource)

        if response.status_code == 201:
            observation_ids.append(response.json().get("id"))
        else:
            raise Exception(f"Failed to create FHIR Observation: {response.text}")

    return [{"name": test["name"], "id": observation_id} for test, observation_id in zip(lab_tests, observation_ids)]






