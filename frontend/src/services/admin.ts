export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
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

  async getLabSetObservations(labSetId: string): Promise<Observation[]> {
    const response = await fetch(`${API_BASE_URL}/api/lab_set/${labSetId}/observations`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch lab set observations");
    }

    const data = await response.json();
    return data.observations;
  },
};
