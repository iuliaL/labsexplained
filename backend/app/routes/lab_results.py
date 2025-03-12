from fastapi import APIRouter, UploadFile, File
import pandas as pd
import openai
from app.services.fhir_service import send_lab_results_to_fhir
from app.config import OPENAI_API_KEY

router = APIRouter()

openai.api_key = OPENAI_API_KEY

@router.post("/interpret-lab-results/")
async def interpret_lab_results(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)
    results = []

    for _, row in df.iterrows():
        prompt = f"Explain {row['Test Name']} level of {row['Value']} {row['Unit']} in layman's terms."
        ai_response = openai.ChatCompletion.create(model="gpt-4", messages=[{"role": "user", "content": prompt}])
        explanation = ai_response["choices"][0]["message"]["content"]
        
        # Send data to FHIR
        fhir_response = send_lab_results_to_fhir(patient_id="12345", lab_results=explanation)
        
        results.append({"Test": row["Test Name"], "Value": row["Value"], "Explanation": explanation, "FHIR_Response": fhir_response})

    return {"message": "Lab results interpreted", "results": results}
