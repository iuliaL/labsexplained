import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
import io


def extract_text(filename: str, file_contents: bytes) -> str:
    """Extract text from a PDF or image file using OCR."""
    if filename.endswith(".pdf"):
        # Convert PDF to images and extract text from each page.
        images = convert_from_bytes(file_contents)
        return "\n".join([pytesseract.image_to_string(img) for img in images])
    
    elif filename.endswith((".png", ".jpg", ".jpeg")):
        # Extract text from an image using OCR.
        image = Image.open(io.BytesIO(file_contents))
        return pytesseract.image_to_string(image)
    
    else:
        raise ValueError("Unsupported file format. Upload a PDF or image.")


def mock_parsed_lab_results(extracted_text: str):
    # TODO
    """
    Placeholder function to extract structured lab test data from OCR text.
    This function should later be enhanced with AI/NLP for better parsing.
    """
    # Simulated extracted data (to be replaced with AI/NLP logic)
    return [{"name": "Glucose", "value": 98, "unit": "mg/dL"},
            {"name": "Hemoglobin", "value": 14.2, "unit": "g/dL"}]
