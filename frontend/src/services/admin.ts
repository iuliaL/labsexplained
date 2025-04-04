export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
  lab_test_count: number;
  interpreted_count: number;
}

export interface LabTestSet {
  id: string;
  patient_fhir_id: string;
  test_date: string;
  observations: Array<{
    id: string;
    name: string;
  }>;
  interpretation: string | null;
}

export interface Observation {
  id: string;
  code: {
    text: string;
  };
  valueQuantity?: {
    value: number;
    unit: string;
  };
  valueString?: string;
  referenceRange?: Array<{
    low?: { value: number; unit: string };
    high?: { value: number; unit: string };
    text?: string;
  }>;
}

interface PatientsResponse {
  message: string;
  patients: Patient[];
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

if (!process.env.API_BASE_URL) {
  console.warn("API_BASE_URL is not defined in environment variables. Using fallback: http://localhost:8000");
}

export const adminService = {
  async getPatients(): Promise<PatientsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/patients`);
    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }
    return response.json();
  },

  async getPatient(fhirId: string): Promise<Patient> {
    const response = await fetch(`${API_BASE_URL}/api/patients/${fhirId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patient");
    }

    const data = await response.json();
    return data.patient;
  },

  async getPatientLabTests(patientFhirId: string): Promise<LabTestSet[]> {
    const response = await fetch(`${API_BASE_URL}/api/lab_set/${patientFhirId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patient lab tests");
    }

    const data = await response.json();
    return data.lab_test_sets;
  },

  async getLabSetObservations(observationId: string): Promise<Observation[]> {
    const response = await fetch(`${API_BASE_URL}/api/observations/${observationId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch test result");
    }

    const data = await response.json();
    return data.observations;
  },

  async interpretLabTestSet(labTestSetId: string): Promise<{ interpretation: string }> {
    const response = await fetch(`${API_BASE_URL}/api/lab_set/${labTestSetId}/interpret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to interpret lab test set");
    }

    return await response.json();
  },

  async createPatient(patientData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  }): Promise<{ fhir_id: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        birth_date: new Date(patientData.dateOfBirth).toISOString().split("T")[0], // Convert to YYYY-MM-DD
        gender: patientData.gender,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create patient");
    }

    return await response.json();
  },

  async uploadLabTestSet(patientFhirId: string, testDate: string, file: File): Promise<LabTestSet> {
    const formData = new FormData();
    formData.append("patient_fhir_id", patientFhirId);
    formData.append("test_date", new Date(testDate).toISOString().split("T")[0]); // Convert to YYYY-MM-DD
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/lab_set`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload lab test set");
    }

    return await response.json();
  },

  async deleteLabTestSet(labTestSetId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/lab_set/${labTestSetId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete lab test set");
    }
  },

  async deletePatient(fhirId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/patients/${fhirId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Delete patient response:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(
        `Failed to delete patient: ${response.status} ${response.statusText}${errorData ? ` - ${errorData}` : ""}`
      );
    }
  },
};
