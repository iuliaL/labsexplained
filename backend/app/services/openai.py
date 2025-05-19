import re
from openai import OpenAI
from datetime import datetime
import json
from app.config import GITHUB_TOKEN
from app.utils.file_parser import clean_reference_range


def interpret_full_lab_set(lab_tests: list, birth_date: str, gender: str):
    """
    Uses OpenAI to generate an overall interpretation for the full lab test set.

    Args:
        lab_tests (list): A list of lab test results, each containing:
            - name (str): Test name
            - value (float): Test result value
            - unit (str): Measurement unit
            - reference_range (str, optional): Normal reference range

    Returns:
        str: AI-generated interpretation.
    """
    if not GITHUB_TOKEN:
        raise ValueError(
            "Missing Github Token. Set GITHUB_TOKEN as an environment variable."
        )

    # ✅ Extract relevant lab test details from FHIR Observations
    extracted_tests = []
    for obs in lab_tests:
        if "resourceType" in obs and obs["resourceType"] == "Observation":
            extracted_tests.append(
                {
                    "name": obs["code"]["text"],
                    "value": obs.get("valueQuantity", {}).get("value", "N/A"),
                    "unit": obs.get("valueQuantity", {}).get("unit", "N/A"),
                    "reference_range": obs.get("referenceRange", [{}])[0]
                    .get("low", {})
                    .get("value", "N/A"),
                }
            )

    # ✅ Convert to JSON for AI processing
    lab_results_json = json.dumps(extracted_tests, indent=2)

    patient_age = calculate_age(birth_date) if birth_date else "Unknown"
    gender_prompt = (
        f"The following lab test results belong to a {gender.lower()} gender patient"
        if gender
        else ""
    )
    age_prompt = (
        f"The patient is born on {birth_date} meaning they have an an approximate age of {patient_age}."
        if birth_date
        else ""
    )

    # ✅ Define the GPT prompt
    prompt = f"""
    You are an experienced medical doctor analyzing a patient's lab test results. 
    {gender_prompt}
    {age_prompt}
    Interpret the data considering the patient's age and gender, and provide an evidence-based medical analysis.

    ```json
    {lab_results_json}
    ```

    Instructions:
    - Consider the patient's age and gender when analyzing the results. Carefully consider the patient's age in interpretation. For infants or elderly patients, physiological norms and reference ranges may differ significantly from adults.

    For each test:
    - Include the name, value, unit, and the full reference range, if provided.
    - If the reference range is missing, infer a standard clinical reference range appropriate for the test, using the patient’s age and gender.
    - Confirm that the unit used in the reference range matches the test result.
    - Clearly state whether the test result is within, below, or above the expected range.

    - Do not disregard provided reference ranges. Use both lower and upper thresholds when available. If the test value falls within that range, it should be interpreted as normal.
    - If only a single threshold is present (e.g., “>59”), clarify this and explain its clinical implication.
    - Explain any abnormal values and their significance, and provide a short and relevant physiological background.
    - Identify patterns, correlations, and potential health concerns.
    - When values are normal, affirm them and avoid alarmist language.

    Organize the response into clean sections:
    - Summary of individual test interpretations
    - General findings and possible clinical correlations
    - Actionable recommendations (if any)
    - Do not use first- or second-person language (avoid "I", "you", "we", etc.). Write in an objective, clinical style.
    - Avoid direct references to a speaker (e.g., "I will analyze" or "You should be concerned"). Instead, present findings in an objective and clinically relevant format. 
    - Provide a structured, easy-to-understand explanation for the patient.
    - Ensure your response explicitly acknowledges how gender and age influence the interpretation.
    - Ensure the interpretation is medically informative, neutral in tone, and structured in a clear and professional manner.
    """

    client = OpenAI(
        base_url="https://models.inference.ai.azure.com", api_key=GITHUB_TOKEN
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.2,  # Lower temperature for a more factual, deterministic response
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"Error generating interpretation: {str(e)}"


def extract_lab_results_with_gpt(ocr_text: str):
    """Uses OpenAI's GPT to extract structured lab results from OCR-extracted text."""

    if not GITHUB_TOKEN:
        raise ValueError(
            "Missing OpenAI API Key. Set your GITHUB_TOKEN as an environment variable."
        )

    # Define the GPT prompt for structured lab result extraction
    prompt = f"""
    You are an AI assistant that extracts lab test results from unstructured text.
    The input is an OCR-extracted document that contains medical lab tests, along with some irrelevant text.

    **Your task**: Identify and extract only the **lab test results**, structured in the following JSON format:
    
    ```json
    [
        {{
            "name": "Glucose",
            "value": 98,
            "unit": "mg/dL",
            "reference_range": "70 - 100"
        }},
        {{
            "name": "Hemoglobin",
            "value": 14.2,
            "unit": "g/dL",
            "reference_range": "12.0 - 15.5"
        }}
    ]
    ```

    **Guidelines:**
    - **Only extract lab test results** (ignore patient name, address, doctor name, etc.).
    - **Ensure correct units** (e.g., mg/dL, mmol/L, IU/mL).
    - **Include reference ranges when available**.
    - **Ensure reference ranges are properly formatted (`low - high`, `>X`, `<X`).**
    - **If a reference range is missing in the document, return `null` for `reference_range` (DO NOT GUESS IT).**
    - **Output only valid JSON.**
    - **Do not include markdown backticks (` ``` `) in the response.**

    **Here is the OCR-extracted text:**
    ```
    {ocr_text}
    ```

    **Extract the structured lab results and return them as JSON:**
    """

    client = OpenAI(
        base_url="https://models.inference.ai.azure.com", api_key=GITHUB_TOKEN
    )
    try:
        ai_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.2,  # Low temperature for more deterministic responses
        )

        if not ai_response or not ai_response.choices:
            raise ValueError("Received an empty response from OpenAI API.")

        result = ai_response.choices[0].message.content.strip()

        # ✅ Fix: Remove any markdown backticks (` ```json ... ```) from the response
        result = re.sub(r"```json|```", "", result).strip()

        # ✅ Convert to JSON
        extracted_results = json.loads(result)

        # ✅ Ensure GPT does not hallucinate reference ranges
        for test in extracted_results:
            if "reference_range" in test and test["reference_range"] not in [None, ""]:
                test["reference_range"] = clean_reference_range(test["reference_range"])
            else:
                test["reference_range"] = None  # Explicitly set to None if missing

        return extracted_results

    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON response from OpenAI after cleanup: {result}")

    except Exception as e:
        raise ValueError(f"Error calling OpenAI API: {e}")


def calculate_age(birth_date_str: str):
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
    today = datetime.today()
    age_in_months = (today.year - birth_date.year) * 12 + (
        today.month - birth_date.month
    )
    if age_in_months < 24:
        prompt = f"{age_in_months // 12} year and {age_in_months % 12} months"
        # Use “pediatric” hint for the AI prompt
        prompt += "\nNote: This is a pediatric case. Interpret using pediatric reference ranges and considerations."
        return prompt

    else:
        return f"{(today - birth_date).days // 365} years"
