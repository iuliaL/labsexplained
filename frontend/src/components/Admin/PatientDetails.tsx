import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminService, Patient, LabTestSet } from "../../services/admin";
import { formatDate } from "../../utils/dateFormatter";
import { LabSet } from "./LabSet";
import { Pagination } from "../ui/Pagination";

interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function PatientDetails() {
  const { fhirId } = useParams<{ fhirId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labTestSets, setLabTestSets] = useState<LabTestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    total: 0,
    page: 1,
    page_size: 5,
    total_pages: 0,
  });

  useEffect(() => {
    if (!fhirId) return;
    fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fhirId, pagination.page]); // Re-fetch when page changes

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // First get the patient data
      const patientData = await adminService.getPatient(fhirId!);
      setPatient(patientData);

      // Then get the lab test sets with pagination
      const response = await adminService.getPatientLabTests(fhirId!, pagination.page, pagination.page_size);
      setLabTestSets(response.lab_test_sets);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLabSetDeleted = () => {
    // Refresh the current page
    fetchPatientData();
  };

  const handleInterpretationUpdated = (labTestSetId: string, newInterpretation: string) => {
    setLabTestSets((prevSets) =>
      prevSets.map((set) => (set.id === labTestSetId ? { ...set, interpretation: newInterpretation } : set))
    );
  };

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

  // Helper function to safely capitalize a string
  const capitalize = (str: string | undefined | null) => {
    if (!str) return "Unknown";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/admin/patients"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
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
                {patient.first_name || "Unknown"} {patient.last_name || ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Date of birth</p>
              <p className="text-sm font-medium text-slate-900">
                {patient.birth_date ? formatDate(patient.birth_date) : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Gender</p>
              <p className="text-sm font-medium text-slate-900">{capitalize(patient.gender)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">FHIR ID</p>
              <p className="text-sm font-medium text-slate-900">{patient.fhir_id || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Lab Sets Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Lab Sets</h2>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full ring-1 ring-blue-700/10">
              {pagination.total} total
            </span>
          </div>
          {labTestSets.length === 0 ? (
            <p className="text-sm text-slate-500">No lab sets available</p>
          ) : (
            <>
              <div className="space-y-6">
                {labTestSets.map((testSet) => (
                  <LabSet
                    key={testSet.id}
                    labSet={testSet}
                    onInterpretationUpdated={(newInterpretation) =>
                      handleInterpretationUpdated(testSet.id, newInterpretation)
                    }
                    onDelete={handleLabSetDeleted}
                  />
                ))}
              </div>
              {pagination.total_pages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.total_pages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
