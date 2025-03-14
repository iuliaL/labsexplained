from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from datetime import datetime
import re
from app.services.fhir import send_lab_results_to_fhir
from app.utils.file_parser import extract_text
from app.services.openai import extract_lab_results_with_gpt  # Import AI function


router = APIRouter()

@router.post("/lab_results/")
async def upload_lab_results(
    file: UploadFile = File(...),
    date: str = Form(...),
    patient_fhir_id: str = Form(None)
    ):
    """
    Upload a PDF or image containing lab test results, extract text using OCR, 
    and store structured lab data as FHIR Observations linked to a specific patient.
    """
    # TODO uncomment this
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
         
        # Format response with observation details
        response_data = {
            "message": "Lab results processed successfully.",
            "observations": [
                {"test_name": obs["code"]["text"], "observation_id": obs["id"]} for obs in observations
            ]
        }
        return response_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


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
    

    
