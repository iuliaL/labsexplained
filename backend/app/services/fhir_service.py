import requests
from app.config import FHIR_SERVER_URL
from app.models.patient import store_patient

def create_fhir_patient(first_name, last_name, age):
    """Creates a new patient in FHIR and stores the FHIR ID in MongoDB"""
    patient_resource = {
        "resourceType": "Patient",
        "name": [{"use": "official", "family": last_name, "given": [first_name]}],
        "birthDate": f"{2024-age}-01-01"
    }
    response = requests.post(f"{FHIR_SERVER_URL}/Patient", json=patient_resource)
    
    if response.status_code == 201:
        fhir_id = response.json()["id"]
        return store_patient(first_name, last_name, age, fhir_id)
    return None

def send_lab_results_to_fhir(patient_id, lab_results):
    """Send lab test results to a FHIR server."""
    fhir_resource = {
        "resourceType": "Observation",
        "status": "final",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
        "subject": {"reference": f"Patient/{patient_id}"},
        "code": {"text": "Lab Test Results"},
        "valueString": lab_results
    }
    
    response = requests.post(f"{FHIR_SERVER_URL}/Observation", json=fhir_resource)
    return response.json()

