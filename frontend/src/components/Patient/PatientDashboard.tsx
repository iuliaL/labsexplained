import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminService, Patient, LabTestSet } from "../../services/admin";
import { formatDate } from "../../utils/dateFormatter";
import { UserIcon } from "../icons/UserIcon";
import labTestImage from "../../assets/lab-test.jpeg";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Pagination } from "../ui/Pagination";
import { LabSet } from "../Admin/LabSet";

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

interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function PatientDashboard() {
  const { fhirId } = useParams<{ fhirId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labTestSets, setLabTestSets] = useState<LabTestSet[]>([]);
  const [observations, setObservations] = useState<Record<string, Observation[]>>({});
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loadingInitialObservations, setLoadingInitialObservations] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
  const [isDeletingSet, setIsDeletingSet] = useState(false);
  const [interpretingSetId, setInterpretingSetId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    total: 0,
    page: 1,
    page_size: 5,
    total_pages: 0,
  });

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    // Adjust years and months if birth month hasn't occurred this year
    if (months < 0) {
      years--;
      months += 12;
    }

    // Handle edge case when birth day hasn't occurred this month
    if (today.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    // Format the age string based on the age
    if (years === 0) {
      return `${months} month${months !== 1 ? "s" : ""} old`;
    } else {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }
  };

  // Load observations for a specific lab set
  const loadObservationsForSet = async (labSetId: string) => {
    if (observations[labSetId]) return;

    try {
      const labSet = labTestSets.find((set) => set.id === labSetId);
      if (!labSet) {
        console.error("Lab set not found:", labSetId);
        return;
      }

      const observationPromises = labSet.observations.map((obs) => adminService.getLabSetObservations(obs.id));
      const observationResults = await Promise.all(observationPromises);
      const allObservations = observationResults.flat().filter((obs) => obs && typeof obs === "object");

      if (!Array.isArray(allObservations)) {
        console.error("Invalid observations data received");
        setObservations((prev) => ({ ...prev, [labSetId]: [] }));
        return;
      }

      setObservations((prev) => ({ ...prev, [labSetId]: allObservations }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load observations:", err);
      setObservations((prev) => ({ ...prev, [labSetId]: [] }));
    }
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

  const handleExpand = (testSetId: string) => {
    if (expandedSetId !== testSetId) {
      setExpandedSetId(testSetId);
      loadObservationsForSet(testSetId);
    } else {
      setExpandedSetId(null);
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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Load initial data
  useEffect(() => {
    if (!fhirId) return;

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        // First get the patient data
        const patientData = await adminService.getPatient(fhirId);
        setPatient(patientData);

        // Then get the lab test sets
        const response = await adminService.getPatientLabTests(fhirId!, pagination.page, pagination.page_size);
        const labTestData = response.lab_test_sets;
        setLoading(false);
        setLabTestSets(labTestData);
        setPagination(response.pagination);

        // If we have lab tests, expand and load the most recent one
        if (labTestData.length > 0) {
          const mostRecentTest = labTestData[0];
          setExpandedSetId(mostRecentTest.id);
          setLoadingInitialObservations(true);

          try {
            // Load observations for the most recent test
            const labSet = labTestData[0];
            const observationPromises = labSet.observations.map((obs) => adminService.getLabSetObservations(obs.id));
            const observationResults = await Promise.all(observationPromises);
            const allObservations = observationResults.flat();

            setObservations((prev) => ({ ...prev, [mostRecentTest.id]: allObservations }));
            setLastUpdated(new Date());
          } catch (err) {
            console.error("Failed to load initial observations:", err);
          } finally {
            setLoadingInitialObservations(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fhirId, pagination.page]); // Re-fetch when page changes

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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden relative flex flex-col sm:flex-row items-stretch">
          {/* Mobile background image, full container */}
          <div className="block sm:hidden absolute inset-0 w-full h-full pointer-events-none z-0">
            <img
              src={labTestImage}
              alt="Lab equipment"
              className="w-full h-full object-cover object-center opacity-40"
              style={{
                maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
              }}
            />
          </div>
          {/* Content */}
          <div className="flex-1 p-4 sm:p-8 flex flex-col justify-center items-center sm:items-start z-10">
            <div className="flex flex-col items-center sm:items-start w-full">
              <UserIcon className="h-4 w-4 hidden text-gray-400 mb-2" />
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                Welcome, {patient?.first_name} {patient?.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1 mb-6 sm:mb-4">
                {patient.birth_date && (
                  <span className="inline-block px-2 py-0.5 text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 rounded-full">
                    {calculateAge(patient.birth_date)}
                  </span>
                )}
                <span className="text-xs sm:text-sm text-gray-700">{patient?.email}</span>
              </div>
              <p className=" sm:text-xl sm:mt-4 font-semibold text-center sm:text-left">
                Here are your lab test results and their interpretations
              </p>
              <div className="text-xs text-gray-700 mt-2 text-center sm:text-left">
                Last updated: {formatDate(lastUpdated.toISOString(), "DD.MM.YYYY HH:mm")}
              </div>
            </div>
          </div>
          {/* Background image, subtle and right-aligned for desktop */}
          <div className="hidden sm:block absolute inset-y-0 right-0 w-1/2 pointer-events-none">
            <img
              src={labTestImage}
              alt="Lab equipment"
              className="h-full w-full object-cover object-center opacity-70"
              style={{
                maskImage: "linear-gradient(to left, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to left, black 60%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Lab Sets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-slate-900">Lab Sets</h2>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full ring-1 ring-blue-700/10">
                {pagination.total} total
              </span>
            </span>

            <Link
              to={`/wizard/upload/${fhirId}`}
              className="inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Upload lab results
            </Link>
          </div>
          {labTestSets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-lg text-slate-600">No lab tests available yet</p>
              <p className="text-sm text-slate-500 mt-2">Upload your test results for interpretation</p>
            </div>
          ) : (
            <>
              {labTestSets.map((testSet) => (
                <LabSet
                  key={testSet.id}
                  testSet={testSet}
                  observations={observations[testSet.id]}
                  isLoadingResults={loadingInitialObservations}
                  isExpanded={expandedSetId === testSet.id}
                  onExpand={() => handleExpand(testSet.id)}
                  isDeleting={isDeletingSet}
                  onDelete={() => {
                    setDeletingSetId(testSet.id);
                    setShowDeleteConfirm(true);
                  }}
                  isInterpreting={interpretingSetId === testSet.id}
                  onInterpret={() => handleInterpret(testSet.id)}
                />
              ))}
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

        {/* Delete Confirmation Dialog */}
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

        {/* Loading overlay for interpretation */}
        {interpretingSetId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-4">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-600 mb-4"
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
                <h3 className="text-lg font-medium text-slate-900 mb-2">Generating interpretation</h3>
                <p className="text-sm text-slate-500 text-center">
                  Analyzing your lab test results. This may take a moment...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
