import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminService } from "../services/admin";
import { formatDate } from "../utils/dateFormatter";
import { LabSet } from "./LabSet";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
}

interface Observation {
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

interface LabTestSet {
  id: string;
  patient_fhir_id: string;
  test_date: string;
  observation_ids: string[];
  interpretation: string | null;
  observations?: Observation[];
}

export function PatientDetail() {
  const { fhirId } = useParams<{ fhirId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labTestSets, setLabTestSets] = useState<LabTestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fhirId) return;

    const fetchPatientData = async () => {
      try {
        const patientData = await adminService.getPatient(fhirId);
        setPatient(patientData);

        const labTestData = await adminService.getPatientLabTests(fhirId, true);
        setLabTestSets(labTestData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [fhirId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Patient not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to Patients
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Patient details</h1>

        {/* Personal Information Row */}
        <div className="bg-slate-50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="text-sm font-medium text-slate-900">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Date of birth</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(patient.birth_date)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Gender</p>
              <p className="text-sm font-medium text-slate-900">
                {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">FHIR ID</p>
              <p className="text-sm font-medium text-slate-900">{patient.fhir_id}</p>
            </div>
          </div>
        </div>

        {/* Lab Sets Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Lab Sets</h2>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full ring-1 ring-indigo-700/10">
              {labTestSets.length} total
            </span>
          </div>
          {labTestSets.length === 0 ? (
            <p className="text-sm text-slate-500">No lab sets available</p>
          ) : (
            <div className="space-y-6">
              {labTestSets.map((testSet) => (
                <LabSet
                  key={testSet.id}
                  testDate={testSet.test_date}
                  observations={testSet.observations || []}
                  interpretation={testSet.interpretation}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
