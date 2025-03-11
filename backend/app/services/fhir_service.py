import requests

FHIR_SERVER_URL = "https://hapi.fhir.org/baseR4"

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
