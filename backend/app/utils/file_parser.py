from paddleocr import PaddleOCR
import cv2
import numpy as np
from pdf2image import convert_from_bytes

# Initialize PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang="en")

def extract_text(filename: str, file_contents: bytes) -> str:
    """Extracts text from an image or PDF file using PaddleOCR."""
    
    if filename.endswith(".pdf"):
        # Convert PDF to images
        images = convert_from_bytes(file_contents)
        extracted_text = []
        
        for img in images:
            img_cv = np.array(img)  # Convert image to OpenCV format
            processed_img = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)  # Ensure color format is correct
            
            # Run OCR on each page
            results = ocr.ocr(processed_img, cls=True)
            extracted_text.extend([line[1][0] for line in results[0] if line[1][0]])

        return "\n".join(extracted_text)

    elif filename.endswith((".png", ".jpg", ".jpeg")):
        # Process image directly
        image = cv2.imdecode(np.frombuffer(file_contents, np.uint8), cv2.IMREAD_COLOR)
        results = ocr.ocr(image, cls=True)

        return "\n".join([line[1][0] for line in results[0] if line[1][0]])

    else:
        raise ValueError("Unsupported file format. Upload a PDF or image.")
    

def parse_reference_range(reference_range: str, unit: str):
    """
    Parses the reference range into a FHIR-compatible format.
    
    Handles cases like:
    - "70 - 100" → {"low": 70, "high": 100}
    - ">59" → {"low": 59} (no high value)
    - "<5" → {"high": 5} (no low value)
    """
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
