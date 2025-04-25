import re
from pdf2image import convert_from_bytes
import requests
import mimetypes
from pdf2image import convert_from_bytes
from io import BytesIO
from PIL import Image
from app.config import OCR_SPACE_API_KEY



def extract_text(filename: str, file_contents: bytes) -> str:
    """
    Extract text from an image or PDF file using OCR.Space API.
    """
    texts = []

    def ocr_image(image_bytes, page_name="page.jpg"):
        response = requests.post(
            url="https://api.ocr.space/parse/image",
            files={"file": (page_name, image_bytes)},
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "isOverlayRequired": False,
                "OCREngine": 2  # Optional: Engine 2 is better at structure
            }
        )
        result = response.json()
        if result.get("IsErroredOnProcessing"):
            raise ValueError("OCR API error: " + result.get("ErrorMessage", ["Unknown error"])[0])
        return result["ParsedResults"][0]["ParsedText"]

    if filename.endswith(".pdf"):
        images = convert_from_bytes(file_contents)
        for i, img in enumerate(images):
            buffer = BytesIO()
            img.save(buffer, format="JPEG")
            texts.append(ocr_image(buffer.getvalue(), f"page_{i}.jpg"))
    else:
        texts.append(ocr_image(file_contents, filename))

    final_result= "\n".join(texts)
    
    print("Final OCR.space text extraction", final_result)
    return final_result
    

def parse_reference_range(reference_range: str, unit: str):
    """
    Parses the reference range into a FHIR-compatible format.
    
    Handles cases like:
    - "70 - 100" → {"low": 70, "high": 100}
    - ">59" → {"low": 59} (no high value)
    - "<5" → {"high": 5} (no low value)
    """
    if reference_range is None:
            return None
    
    reference_range = reference_range.strip()

    if " - " in reference_range:  # Standard range case "70 - 100"
        low, high = reference_range.split(" - ")
        return {
            "low": {"value": float(low), "unit": unit},
            "high": {"value": float(high), "unit": unit}
        }
    elif reference_range.startswith(">"):  # Case ">59"
        return {"low": {"value": float(reference_range[1:]), "unit": unit}}
    elif reference_range.startswith("<"):  # Case "<5"
        return {"high": {"value": float(reference_range[1:]), "unit": unit}}

    return None  # If format is unknown, return None



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