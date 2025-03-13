from paddleocr import PaddleOCR
import cv2
import numpy as np
import spacy
from pdf2image import convert_from_bytes
from PIL import Image


# Initialize PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang="en")

def extract_text(filename: str, file_contents: bytes) -> str:
    """Extracts text from an image or PDF file using PaddleOCR."""
    
    if filename.endswith(".pdf"):
        # Convert PDF to images
        images = convert_from_bytes(file_contents)
        extracted_text = []
        
        for img in images:
            img_cv = np.array(img)  # Convert PIL image to OpenCV format
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



nlp = spacy.load("en_core_web_sm")  # Load NLP model

# TODO this is not yet used, this is the next step
def parse_lab_results(extracted_text: str):
    """Uses NLP to extract structured lab test results from OCR text."""

    doc = nlp(extracted_text)  # Process text using spaCy

    structured_results = []
    test_name = None
    value = None
    unit = None
    reference_range = None

    for token in doc:
        if token.like_num:  # Check if token is a number (possible test result)
            if test_name:
                value = float(token.text)  # Convert to float
        elif token.text in ["pg/mL", "mg/dL", "pmol/L", "μIU/mL", "U/L"]:  # Common lab units
            unit = token.text
        elif token.text == "-":  # Detect reference range (e.g., "70 - 99")
            reference_range = f"{doc[token.i-1].text} - {doc[token.i+1].text}"
        else:
            if value and unit:  # If we have collected test data, store it
                structured_results.append({
                    "name": test_name,
                    "value": value,
                    "unit": unit,
                    "reference_range": reference_range
                })
                test_name, value, unit, reference_range = None, None, None, None  # Reset for next test

            # Assume the token is part of the lab test name
            if not test_name:
                test_name = token.text
            else:
                test_name += " " + token.text  # Keep adding words for multi-word test names

    return structured_results


def mock_parsed_lab_results(extracted_text: str):
    # TODO
    """
    Placeholder function to extract structured lab test data from OCR text.
    This function should later be enhanced with AI/NLP for better parsing.
    """
    # Simulated extracted data (to be replaced with AI/NLP logic)
    return [{"name": "Glucose", "value": 98, "unit": "mg/dL"},
            {"name": "Hemoglobin", "value": 14.2, "unit": "g/dL"}]
