import requests
import json
from app.config import FHIR_SERVER_URL
from app.models.patient import store_patient

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
    """
    Sends structured lab test results to the FHIR server as Observation resources.
    Includes the test date provided by the patient.


    Args:
        patient_fhir_id (str): The FHIR ID of the patient to associate the observations with.
        lab_tests (list): A list of dictionaries containing lab test results.
        date: Date of the lab examination inputed by the patient.

    Returns:
        list: A list of FHIR server responses for each Observation created.
    """

    headers = {"Content-Type": "application/fhir+json"}

    fhir_observations = []
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
            "effectiveDateTime": date,  # 🆕 Now adding the provided date!
            "valueQuantity": {
                "value": test["value"],
                "unit": test["unit"]
            },
             "referenceRange": [
                {
                    "low": {"value": float(test["reference_range"].split(" - ")[0]), "unit": test["unit"]},
                    "high": {"value": float(test["reference_range"].split(" - ")[1]), "unit": test["unit"]}
                }
            ]
        }
        fhir_observations.append(observation_resource)
    print("Observations sent to FHIR", fhir_observations)

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
    






