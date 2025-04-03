interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
}

interface LabTestSet {
  id: string;
  patient_fhir_id: string;
  test_date: string;
  observation_ids: string[];
  interpretation: string | null;
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

  async getPatientLabTests(patientFhirId: string, includeObservations: boolean = false): Promise<LabTestSet[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/patients/${patientFhirId}?include_observations=${includeObservations}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch patient lab tests");
    }

    const data = await response.json();
    return data.patient.lab_test_sets || [];
  },
};
