from app.config import GITHUB_TOKEN
import re
from openai import OpenAI
import json


def extract_lab_results_with_gpt(ocr_text: str):
    """Uses OpenAI's GPT to extract structured lab results from OCR-extracted text."""
    
    if not GITHUB_TOKEN:
        raise ValueError("Missing OpenAI API Key. Set your GITHUB_TOKEN as an environment variable.")

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
    - **Ensure correct units** (e.g., mg/dL, mmol/L, UI/mL).
    - **Include reference ranges when available**.
    - **Output only valid JSON.**
    - **Do not include markdown backticks (` ``` `) in the response.**

    **Here is the OCR-extracted text:**
    ```
    {ocr_text}
    ```

    **Extract the structured lab results and return them as JSON:**
    """

    client = OpenAI(
        base_url="https://models.inference.ai.azure.com",
        api_key=GITHUB_TOKEN
    )
    try:
        ai_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.2  # Low temperature for more deterministic responses
            )

        if not ai_response or not ai_response.choices:
            raise ValueError("Received an empty response from OpenAI API.")

        result = ai_response.choices[0].message.content.strip()

        # ✅ Fix: Remove any markdown backticks (```json ... ```) from the response
        result = re.sub(r"```json|```", "", result).strip()

        # Ensure output is valid JSON
        return json.loads(result)

    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON response from OpenAI after cleanup: {result}")

    except Exception as e:
        raise ValueError(f"Error calling OpenAI API: {e}")
