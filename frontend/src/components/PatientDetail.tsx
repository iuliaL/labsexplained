import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminService } from "../services/admin";
import { formatDate } from "../utils/dateFormatter";

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

        const labTestData = await adminService.getPatientLabTests(fhirId);
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Patient details</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal information</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-slate-500">Name:</span>{" "}
                <span className="font-medium">
                  {patient.first_name} {patient.last_name}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Date of birth:</span>{" "}
                <span className="font-medium">{formatDate(patient.birth_date)}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Gender:</span>{" "}
                <span className="font-medium">{patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">FHIR ID:</span> <span className="font-medium">{patient.fhir_id}</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Lab Sets</h2>
          {labTestSets.length === 0 ? (
            <p className="text-sm text-slate-500">No lab sets available</p>
          ) : (
            <div className="space-y-6">
              {labTestSets.map((testSet) => (
                <div key={testSet.id} className="bg-slate-50 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-md font-semibold text-slate-900">
                      Test Set from {formatDate(testSet.test_date)}
                    </h3>
                    <p className="text-sm text-slate-500">Number of tests in this set: {testSet.observation_ids.length}</p>
                  </div>

                  {testSet.interpretation && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Interpretation</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{testSet.interpretation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
