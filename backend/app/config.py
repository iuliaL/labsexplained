import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get environment variables
FHIR_SERVER_URL = os.getenv("FHIR_SERVER_URL")
MONGO_URI = os.getenv("MONGO_URI")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
