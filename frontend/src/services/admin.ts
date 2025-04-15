import { authService } from "./auth";

export interface Patient {
  id: string;
  email: string;
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

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface LabTestsResponse {
  lab_test_sets: LabTestSet[];
  pagination: PaginationMetadata;
}

export interface PatientsResponse {
  message: string;
  patients: Patient[];
  pagination: PaginationMetadata;
}

interface CreatePatientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

interface CreatePatientResponse {
  fhir_id: string;
  message: string;
  token: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn("REACT_APP_API_BASE_URL is not defined in environment variables. Using fallback: http://localhost:8000");
}

// Helper function to get headers with auth token
const getHeaders = (isFormData: boolean = false) => {
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = authService.getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export const adminService = {
  async getPatients(page: number = 1, pageSize: number = 10): Promise<PatientsResponse> {
    const response = await fetch(`${API_BASE_URL}/patients?page=${page}&page_size=${pageSize}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }
    return response.json();
  },

  async getPatient(fhirId: string): Promise<Patient> {
    const response = await fetch(`${API_BASE_URL}/patients/${fhirId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch patient");
    }

    const data = await response.json();
    return data.patient;
  },

  async getPatientLabTests(fhirId: string, page: number = 1, pageSize: number = 5): Promise<LabTestsResponse> {
    const response = await fetch(`${API_BASE_URL}/lab_set/${fhirId}?page=${page}&page_size=${pageSize}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch lab tests");
    }
    return response.json();
  },

  async getLabSetObservations(observationId: string): Promise<Observation[]> {
    const response = await fetch(`${API_BASE_URL}/observations/${observationId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch test result");
    }

    const data = await response.json();
    return data.observations;
  },

  async interpretLabTestSet(labTestSetId: string): Promise<{ interpretation: string }> {
    const response = await fetch(`${API_BASE_URL}/lab_set/${labTestSetId}/interpret`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to interpret lab test set");
    }

    return await response.json();
  },

  async createPatient(patientData: CreatePatientRequest): Promise<CreatePatientResponse> {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: patientData.email,
        password: patientData.password,
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        birth_date: new Date(patientData.dateOfBirth).toISOString().split("T")[0], // Convert to YYYY-MM-DD
        gender: patientData.gender,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create patient");
    }

    const data = await response.json();
    // Store the token in cookies using authService
    if (data.token) {
      authService.setAuthToken(data.token);
    }
    return data;
  },

  async uploadLabTestSet(patientFhirId: string, testDate: string, file: File): Promise<LabTestSet> {
    const formData = new FormData();
    formData.append("patient_fhir_id", patientFhirId);
    formData.append("test_date", new Date(testDate).toISOString().split("T")[0]); // Convert to YYYY-MM-DD
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/lab_set`, {
      method: "POST",
      body: formData,
      headers: getHeaders(true), // Pass true for FormData
    });

    if (!response.ok) {
      throw new Error("Failed to upload lab test set");
    }

    return await response.json();
  },

  async deleteLabTestSet(labTestSetId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/lab_set/${labTestSetId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete lab test set");
    }
  },

  async deletePatient(fhirId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/patients/${fhirId}`, {
      method: "DELETE",
      headers: getHeaders(),
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
