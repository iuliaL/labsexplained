from app.config import GITHUB_TOKEN
import re
from openai import OpenAI
import json


def clean_reference_range(reference_range: str):
    """
    Cleans up reference range values extracted by GPT.
    Ensures they are in a valid "low - high", ">X", or "<X" format.

    Args:
        reference_range (str): Raw extracted reference range.

    Returns:
        str: Cleaned reference range, or None if invalid.
    """
    if not reference_range or not isinstance(reference_range, str):
        return None

    reference_range = reference_range.strip()

    # ✅ Fix common extraction issues: remove unwanted characters
    reference_range = re.sub(r"[-–—]+>", ">", reference_range)  # Handle cases like "->59"
    reference_range = re.sub(r"[-–—]+<", "<", reference_range)  # Handle cases like "-<5"
    reference_range = re.sub(r"[-–—]+$", "", reference_range)  # Remove trailing hyphens

    # ✅ Ensure it matches expected formats
    if " - " in reference_range:  # Standard range case "70 - 100"
        parts = reference_range.split(" - ")
        if len(parts) == 2 and parts[0].replace('.', '', 1).isdigit() and parts[1].replace('.', '', 1).isdigit():
            return reference_range

    elif reference_range.startswith(">") or reference_range.startswith("<"):  # Handle ">59" and "<5"
        numeric_part = reference_range[1:].strip()
        if numeric_part.replace('.', '', 1).isdigit():
            return reference_range

    return None  # Return None if the format is invalid


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

