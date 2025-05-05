import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminService, Patient, LabTestSet, Observation } from "../../services/admin";
import { formatDate } from "../../utils/dateFormatter";
import { LabSet } from "./LabSet";
import { Pagination } from "../ui/Pagination";
import AdminIcon from "../icons/AdminIcon";
import PatientIcon from "../icons/PatientIcon";
import { ConfirmDialog } from "../ui/ConfirmDialog";

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
  const [observations, setObservations] = useState<Record<string, Observation[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
  const [isDeletingSet, setIsDeletingSet] = useState(false);
  const [interpretingSetId, setInterpretingSetId] = useState<string | null>(null);
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
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
      const labTestData = response.lab_test_sets;
      setLabTestSets(labTestData);
      setPagination(response.pagination);
      setLoading(false);
      // If we have lab tests, expand and load the most recent one
      if (labTestData.length > 0) {
        const mostRecentTest = labTestData[0];
        setExpandedSetId(mostRecentTest.id);
        setLoadingObservations(true);

        try {
          // Load observations for the most recent test
          const labSet = labTestData[0];
          const observationPromises = labSet.observations.map((obs) => adminService.getLabSetObservation(obs.id));
          const observationResults = await Promise.all(observationPromises);
          const allObservations = observationResults.flat();

          setObservations((prev) => ({ ...prev, [mostRecentTest.id]: allObservations }));
        } catch (err) {
          console.error("Failed to load initial observations:", err);
        } finally {
          setLoadingObservations(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (setId: string) => {
    setIsDeletingSet(true);
    try {
      await adminService.deleteLabTestSet(setId);
      setLabTestSets((prev) => prev.filter((set) => set.id !== setId));
      setShowDeleteConfirm(false);
      setDeletingSetId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lab test set");
    } finally {
      setIsDeletingSet(false);
    }
  };

  const handleInterpret = async (setId: string) => {
    setInterpretingSetId(setId);
    try {
      const result = await adminService.interpretLabTestSet(setId);
      setLabTestSets((prev) =>
        prev.map((set) => (set.id === setId ? { ...set, interpretation: result.interpretation } : set))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to interpret lab test set");
    } finally {
      setInterpretingSetId(null);
    }
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
  // Load observations for a specific lab set
  const loadObservationsForSet = async (labSetId: string) => {
    if (observations[labSetId]) return;

    try {
      const labSet = labTestSets.find((set) => set.id === labSetId);
      if (!labSet) {
        console.error("Lab set not found:", labSetId);
        return;
      }
      setLoadingObservations(true);

      const observationPromises = labSet.observations.map((obs) => adminService.getLabSetObservation(obs.id));
      const observationResults = await Promise.all(observationPromises);
      const allObservations = observationResults.flat().filter((obs) => obs && typeof obs === "object");

      if (!Array.isArray(allObservations)) {
        console.error("Invalid observations data received");
        setObservations((prev) => ({ ...prev, [labSetId]: [] }));
        return;
      }

      setObservations((prev) => ({ ...prev, [labSetId]: allObservations }));
    } catch (err) {
      console.error("Failed to load observations:", err);
      setObservations((prev) => ({ ...prev, [labSetId]: [] }));
    } finally {
      setLoadingObservations(false);
    }
  };

  const handleExpand = (testSetId: string) => {
    if (loadingObservations) return;
    if (expandedSetId !== testSetId) {
      setExpandedSetId(testSetId);
      loadObservationsForSet(testSetId);
    } else {
      setExpandedSetId(null);
    }
  };

  // Helper function to safely capitalize a string
  const capitalize = (str: string | undefined | null) => {
    if (!str) return "Unknown";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const interpreted_count = labTestSets.filter((set) => set.interpretation).length;
  const isAdmin = patient.is_admin;
  const AdminStatus = (
    <span
      className={`ml-2 px-2 py-0.5 text-xs sm:text-sm font-semibold rounded-full flex items-center gap-1 ${
        isAdmin ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {isAdmin ? (
        <AdminIcon width={12} height={12} className="inline-block" />
      ) : (
        <PatientIcon width={12} className="inline-block" />
      )}
      <span>{isAdmin ? "Admin" : "Patient"}</span>
    </span>
  );
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 inline-block">Patient details</h1>
          {AdminStatus}
        </div>

        {/* Personal Information Row */}
        <div className="bg-slate-50 rounded-lg p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-slate-500">Name</p>
              <p className="text-xs sm:text-sm font-medium text-slate-900">
                {patient.first_name || "Unknown"} {patient.last_name || ""}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500">User</p>
              <p className="text-xs sm:text-sm font-medium text-slate-900">{patient.email}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500">Date of birth</p>
              <p className="text-xs sm:text-sm font-medium text-slate-900">
                {patient.birth_date ? formatDate(patient.birth_date) : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500">Gender</p>
              <p className="text-xs sm:text-sm font-medium text-slate-900">{capitalize(patient.gender)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500">FHIR ID</p>
              <p className="text-xs sm:text-sm font-medium text-slate-900">{patient.fhir_id}</p>
            </div>
          </div>
        </div>

        {/* Lab Sets Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Lab Sets</h2>
            <span className="px-2.5 py-0.5 text-xs sm:text-sm font-medium bg-blue-100 text-blue-700 rounded-full ring-1 ring-blue-700/10">
              {labTestSets.length} total
            </span>
            {interpreted_count === labTestSets.length ? (
              <span className="px-2 py-0.5 text-xs sm:text-sm font-medium bg-emerald-50 ring-1 ring-emerald-700/10 text-emerald-700 rounded-full">
                {interpreted_count} Interpreted
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs sm:text-sm font-medium bg-red-50 text-red-700 rounded-full">
                {labTestSets.length - interpreted_count} Not interpreted yet
              </span>
            )}
          </div>
          {/* Lab Sets */}
          {labTestSets.length === 0 ? (
            <p className="text-sm text-slate-500">No lab sets available</p>
          ) : (
            <>
              <div className="space-y-6">
                {labTestSets.map((testSet) => (
                  <LabSet
                    key={testSet.id}
                    testSet={testSet}
                    observations={observations[testSet.id]}
                    isLoadingResults={loadingObservations}
                    isDeleting={isDeletingSet}
                    isExpanded={expandedSetId === testSet.id}
                    onExpand={() => handleExpand(testSet.id)}
                    onInterpret={() => handleInterpret(testSet.id)}
                    isInterpreting={interpretingSetId === testSet.id}
                    onDelete={() => {
                      setShowDeleteConfirm(true);
                      setDeletingSetId(testSet.id);
                    }}
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
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingSetId(null);
        }}
        onConfirm={() => deletingSetId && handleDelete(deletingSetId)}
        title="Delete Lab Test Set"
        message="Are you sure you want to delete this lab test set? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      {/* Loading overlay for deletion */}
      {isDeletingSet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-10 w-10 text-red-600 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Deleting lab test set</h3>
              <p className="text-sm text-slate-500 text-center">Removing the lab test set and associated data...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
