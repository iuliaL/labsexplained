from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from datetime import datetime
import re
from app.services.fhir import send_lab_results_to_fhir, delete_all_observations_for_patient, delete_fhir_observation, get_fhir_observations
from app.utils.file_parser import extract_text
from app.services.openai import extract_lab_results_with_gpt
from app.models.lab_test_set import get_lab_test_sets_for_patient, delete_lab_test_set, store_lab_test_set


router = APIRouter()

@router.get("/lab_set/{patient_fhir_id}")
async def get_all_patient_lab_sets(patient_fhir_id: str, include_observations: bool = False):
    """
    Retrieves all lab test sets for a specific patient.
    
    If `include_observations=True`, fetches full observation details from FHIR.
    """
    lab_test_sets = get_lab_test_sets_for_patient(patient_fhir_id)

    if include_observations:
        for test_set in lab_test_sets:
            test_set["observations"] = get_fhir_observations(test_set["observation_ids"])

    return {"lab_test_sets": lab_test_sets}


@router.post("/lab_set")
async def upload_patient_lab_test_set(
    file: UploadFile = File(...),
    date: str = Form(...),
    patient_fhir_id: str = Form(...)
    ):
    """
    Upload a PDF or image containing lab test results, extract text using OCR, 
    and store structured lab data as FHIR Observations linked to a specific patient.
    """

    if not patient_fhir_id:
        raise HTTPException(status_code=400, detail="Patient FHIR ID is required.")

    # If date is missing or empty, use today's date
    if not date or date.strip() == "":
        date = datetime.today().strftime('%Y-%m-%d')

    # Validate the date format (YYYY-MM-DD)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    try:
        contents = await file.read()
        extracted_text = extract_text(file.filename, contents)
        print("Extracted OCR text:", extracted_text)

        # Use GPT-4 to extract structured lab results
        structured_results = extract_lab_results_with_gpt(extracted_text)
        # Parse extracted text into structured lab results
        print("JSON structured lab tests", structured_results)

        # Send structured lab results to FHIR
        observations = send_lab_results_to_fhir(structured_results, patient_fhir_id, date)
        
        # Store only observation IDs in MongoDB
        observation_ids = [obs["id"] for obs in observations if "id" in obs]
        lab_test_set = store_lab_test_set(patient_fhir_id, date, observation_ids)
   
        response_data = {
            "message": "Lab results processed successfully.",
            "lab_test_set": lab_test_set
        }
        return response_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/lab_set/{lab_test_set_id}")
async def delete_lab_test_set(lab_test_set_id: str):
    """
    Deletes a specific lab test set.
    """
    result = delete_lab_test_set(lab_test_set_id)
    return result


    
@router.delete("/observations/{observation_id}")
async def delete_observation(observation_id: str):
    """Deletes a specific Observation by its ID."""
    result = delete_fhir_observation(observation_id)
    return result


@router.delete("/observations/patient/{patient_fhir_id}")
async def delete_all_observations_for_patient(patient_fhir_id: str):
    """Deletes all Observations linked to a specific patient."""
    result = delete_all_observations_for_patient(patient_fhir_id)
    return result







# this is not used for now
# @router.post("/interpret-lab-results/")
# async def interpret_lab_results(patient_id, file: UploadFile = File(...)):
#     df = pd.read_csv(file.file)
#     results = []

#     for _, row in df.iterrows():
#         prompt = f"Explain {row['Test Name']} level of {row['Value']} {row['Unit']} in layman's terms."
#         ai_response = openai.ChatCompletion.create(model="gpt-4", messages=[{"role": "user", "content": prompt}])
#         explanation = ai_response["choices"][0]["message"]["content"]
        
#         # Send data to FHIR
#         fhir_response = send_lab_results_to_fhir(patient_id, lab_results=explanation)
        
#         results.append({"Test": row["Test Name"], "Value": row["Value"], "Explanation": explanation, "FHIR_Response": fhir_response})

#     return {"message": "Lab results interpreted", "results": results}
    

    
