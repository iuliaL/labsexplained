from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
import os

app = FastAPI(
    title="LabsExplained API",
    description="LabsExplained API is a RESTful API that provides access to users (admins and patients) to manage their resources depending on their role.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(router)

@app.get("/")
def home():
    return {"message": "LabsExplained API Running"}
