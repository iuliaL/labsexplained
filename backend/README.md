# 🚀 Backend Plan for AI-Powered Medical Dashboard (FHIR Integration)

## 📈 Project Overview

This backend system allows **patients** to enter their **name, age, and lab test data**, stores the data in a **FHIR-compliant system**, and provides **AI-based lab result interpretations**. The system consists of:

- ✨ **FastAPI for the backend API**
- ⚛️ **FHIR for patient & lab result storage**
- 🤖 **GPT-4 for lab result interpretation**
- 📂 **MongoDB for storing patient FHIR IDs**

---

## 🛠️ Required Backend Components

| Component                            | Description                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| **1. Patient Registration API**      | Registers a new patient in **FHIR** and stores their **FHIR ID** in MongoDB. |
| **2. Lab Test Upload & AI Analysis** | Uploads lab results, sends them to **AI**, and stores them in **FHIR**.      |
| **3. MongoDB Storage**               | Stores **FHIR Patient IDs** and additional metadata locally.                 |
| **4. API Endpoints**                 | Handles **patient creation, lab result processing, and retrieval**.          |

---

## 📁 Project Folder Structure

```
backend/
│── app/
│   ├── routes/
│   │   ├── lab_results.py      # Handles lab results
│   │   ├── patients.py         # Handles patient data
│   │   ├── __init__.py         # Auto-discovers routes
│   ├── main.py                 # Registers all routes
│   ├── config.py               # Stores environment settings
│   ├── services/
│   │   ├── fhir_service.py      # FHIR integration logic
│   ├── models/
│   │   ├── patient_model.py     # MongoDB patient schema
│   ├── utils/                  # Helper functions
```

---

## 🔍 API Endpoints

### **1️⃣  Register a New Patient**

- **Receives:** `{ "first_name": "John", "last_name": "Doe", "age": 35 }`
- **Stores in FHIR & MongoDB**
- **Returns:** `{ "fhir_id": "12345", "message": "Patient registered successfully" }`

### **2️⃣ Upload & Process Lab Test Results**

- **Receives:** `{ "fhir_id": "12345", "file": CSV }`
- **Extracts lab data, AI interprets, stores in FHIR**
- **Returns:** `{ "message": "Results processed", "fhir_observation_id": "67890" }`

### **3️⃣ Retrieve Patient Data**

- **Fetches** patient data from FHIR & MongoDB.
- **Returns:** `{ "first_name": "John", "last_name": "Doe", "age": 35, "fhir_id": "12345" }`

---

## 💻 Code Implementation

### **1️⃣ Define Patient Model in MongoDB**

```python
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["medical_dashboard"]
patients_collection = db["patients"]

def store_patient(first_name, last_name, age, fhir_id):
    """Stores the patient in MongoDB"""
    patient = {"first_name": first_name, "last_name": last_name, "age": age, "fhir_id": fhir_id}
    patients_collection.insert_one(patient)
    return patient

def get_patient(fhir_id):
    """Retrieves patient from MongoDB"""
    return patients_collection.find_one({"fhir_id": fhir_id})
```

### 2️⃣ Create FHIR Patient

```python
import requests
from app.models.patient_model import store_patient

FHIR_SERVER_URL = "https://hapi.fhir.org/baseR4"

def create_fhir_patient(first_name, last_name, age):
    """Creates a new patient in FHIR and stores the FHIR ID in MongoDB"""
    patient_resource = {
        "resourceType": "Patient",
        "name": [{"use": "official", "family": last_name, "given": [first_name]}],
        "birthDate": f"{2024-age}-01-01"
    }
    response = requests.post(f"{FHIR_SERVER_URL}/Patient", json=patient_resource)
    
    if response.status_code == 201:
        fhir_id = response.json()["id"]
        return store_patient(first_name, last_name, age, fhir_id)
    return None
```

### 3️⃣ Register Routes

```python
from fastapi import FastAPI
from app.routes import patients, lab_results

app = FastAPI()

app.include_router(patients.router, prefix="/api", tags=["Patients"])
app.include_router(lab_results.router, prefix="/api", tags=["Lab Results"])

@app.get("/")
def home():
    return {"message": "Medical AI Dashboard API Running"}
```

---

## **🚀 Final API Flow**

1️⃣ **User enters name & age → Creates patient in FHIR → Stores FHIR ID in MongoDB**\
2️⃣ **User uploads lab results (CSV) → AI explains → Stores results in FHIR**\
3️⃣ **User can retrieve stored lab results & patient info**
