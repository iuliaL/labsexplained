import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get environment variables
FHIR_SERVER_URL = os.getenv("FHIR_SERVER_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
