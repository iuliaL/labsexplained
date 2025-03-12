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
    """Retrieves patient from MongoDB by fhir_id"""
    return patients_collection.find_one({"fhir_id": fhir_id})

def search_patient(first_name, last_name):
    """Retrieves patient from MongoDB by first and lastname"""
    return patients_collection.find_one({"first_name": first_name, "last_name": last_name})

def delete_patient(fhir_id):
    """Deletes a patient from MongoDB"""
    patients_collection.delete_one({"fhir_id": fhir_id})
