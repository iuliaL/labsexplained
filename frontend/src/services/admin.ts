import { apiRequest } from "../utils/api";

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
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn("REACT_APP_API_BASE_URL is not defined in environment variables. Using fallback: http://localhost:8000");
}

export const adminService = {
  async getPatients(page: number = 1, pageSize: number = 10): Promise<PatientsResponse> {
    return apiRequest<PatientsResponse>(`${API_BASE_URL}/patients?page=${page}&page_size=${pageSize}`);
  },

  async getPatient(fhirId: string): Promise<Patient> {
    const data = await apiRequest<{ patient: Patient }>(`${API_BASE_URL}/patients/${fhirId}`);
    return data.patient;
  },

  async getPatientLabTests(fhirId: string, page: number = 1, pageSize: number = 5): Promise<LabTestsResponse> {
    return apiRequest<LabTestsResponse>(`${API_BASE_URL}/lab_set/${fhirId}?page=${page}&page_size=${pageSize}`);
  },

  async getLabSetObservations(observationId: string): Promise<Observation> {
    const data = await apiRequest<Observation>(`${API_BASE_URL}/observations/${observationId}`);
    return data;
  },

  async interpretLabTestSet(labTestSetId: string): Promise<{ interpretation: string }> {
    return apiRequest<{ interpretation: string }>(`${API_BASE_URL}/lab_set/${labTestSetId}/interpret`, {
      method: "POST",
    });
  },

  async createPatient(patientData: CreatePatientRequest): Promise<CreatePatientResponse> {
    return apiRequest<CreatePatientResponse>(`${API_BASE_URL}/patients`, {
      method: "POST",
      body: JSON.stringify({
        email: patientData.email,
        password: patientData.password,
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        birth_date: new Date(patientData.dateOfBirth).toISOString().split("T")[0], // Convert to YYYY-MM-DD
        gender: patientData.gender,
      }),
    });
  },

  async uploadLabTestSet(patientFhirId: string, testDate: string, file: File): Promise<LabTestSet> {
    const formData = new FormData();
    formData.append("patient_fhir_id", patientFhirId);
    formData.append("test_date", new Date(testDate).toISOString().split("T")[0]); // Convert to YYYY-MM-DD
    formData.append("file", file);

    return apiRequest<LabTestSet>(`${API_BASE_URL}/lab_set`, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  async deleteLabTestSet(labTestSetId: string): Promise<void> {
    await apiRequest(`${API_BASE_URL}/lab_set/${labTestSetId}`, {
      method: "DELETE",
    });
  },

  async deletePatient(fhirId: string): Promise<void> {
    await apiRequest(`${API_BASE_URL}/patients/${fhirId}`, {
      method: "DELETE",
    });
  },
};
