from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.config import FRONTEND_URL
import os
from pymongo import MongoClient
import requests
from app.config import MONGO_URI, FHIR_SERVER_URL
from app.utils.csrf import CSRFMiddleware


app = FastAPI(
    title="LabsExplained API",
    description="LabsExplained API is a RESTful API that provides access to users (admins and patients) to manage their resources depending on their role.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add CSRF middleware
app.add_middleware(CSRFMiddleware)

app.include_router(router)


print("🔥 LabsExplained backend is booting up...")

# Check required environment variables
required_vars = [
    "FHIR_SERVER_URL",
    "MONGO_URI",
    "GITHUB_TOKEN",
    "SECRET_KEY",
    "ALGORITHM",
    "EMAIL_FROM",
    "MAILGUN_API_KEY",
    "MAILGUN_DOMAIN",
    "FRONTEND_URL",
]

missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    print(f"⚠️ Missing required environment variables: {missing}")
else:
    print("✅ All required environment variables loaded.")


# Check MongoDB connection
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    client.server_info()  # Force connection
    print("✅ MongoDB connection successful.")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")

# Check FHIR server
try:
    resp = requests.get(FHIR_SERVER_URL + "/metadata", timeout=3)
    if resp.ok:
        print(f"✅ FHIR server reachable: {FHIR_SERVER_URL}")
    else:
        print(f"⚠️ FHIR server returned status {resp.status_code}")
except Exception as e:
    print(f"❌ FHIR server check failed: {e}")
