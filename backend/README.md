# 🚀 Backend Plan for AI-Powered Medical Dashboard (FHIR Integration)

## 📈 Project Overview

This backend system allows **patients** to enter their **name, date of birth, and lab test data**, stores the data in a **FHIR-compliant system**, and provides **AI-based lab result interpretations**. The system consists of:

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

```sh
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

- **Receives:** `{ "first_name": "John", "last_name": "Doe", "birth_date": 1990-03-01 }`
- **Stores in FHIR & MongoDB**
- **Returns:** `{ "fhir_id": "12345", "message": "Patient registered successfully" }`

### **2️⃣ Upload & Process Lab Test Results**

- **Receives:** `{ "fhir_id": "12345", "file": CSV }`
- **Extracts lab data, AI interprets, stores in FHIR**
- **Returns:** `{ "message": "Results processed", "fhir_observation_id": "67890" }`

### **3️⃣ Retrieve Patient Data**

- **Fetches** patient data from FHIR & MongoDB.
- **Returns:** `{ "first_name": "John", "last_name": "Doe","birth_date": 1990-03-01 }`



---

## **🚀 Final API Flow**

1️⃣ **User enters name & birth date → Creates patient in FHIR → Stores FHIR ID in MongoDB**\
2️⃣ **User uploads lab results (CSV) → AI explains → Stores results in FHIR**\
3️⃣ **User can retrieve stored lab results & patient info**
