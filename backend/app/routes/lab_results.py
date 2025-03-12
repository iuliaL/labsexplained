from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import openai
from app.services.fhir_service import send_lab_results_to_fhir
from app.config import OPENAI_API_KEY
from app.utils.file_parser import extract_text, mock_parsed_lab_results, parse_lab_results

router = APIRouter()

openai.api_key = OPENAI_API_KEY

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

@router.post("/lab_results/")
async def upload_lab_results(file: UploadFile = File(...), patient_fhir_id: str = None):
    """
    Upload a PDF or image containing lab test results, extract text using OCR, 
    and store structured lab data as FHIR Observations linked to a specific patient.
    """
    if not patient_fhir_id:
        raise HTTPException(status_code=400, detail="Patient FHIR ID is required.")
    try:
        contents = await file.read()
        extracted_text = extract_text(file.filename, contents)
        # Parse extracted text into structured lab results
        lab_tests = mock_parsed_lab_results(extracted_text)

        # Send structured lab results to FHIR
        observations = send_lab_results_to_fhir(patient_fhir_id, lab_tests)   
         
        # Format response with observation details
        response_data = {
            "message": "Lab results processed successfully.",
            "observations": [
                {"test_name": obs["name"], "observation_id": obs["id"]} for obs in observations
            ]
        }
        return response_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
