interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
}

interface LabTest {
  id: string;
  date: string;
  type: string;
  result: string;
  interpretation: string;
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

if (!process.env.API_BASE_URL) {
  console.warn("API_BASE_URL is not defined in environment variables. Using fallback: http://localhost:8000");
}

export const adminService = {
  async getPatients(): Promise<Patient[]> {
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }

    const data = await response.json();
    return data.patients;
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

  async getPatientLabTests(patientId: string): Promise<LabTest[]> {
    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/lab-tests`, {
      headers: {
        "Content-Type": "application/json",
        // Add any auth headers here
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patient lab tests");
    }

    return response.json();
  },
};
