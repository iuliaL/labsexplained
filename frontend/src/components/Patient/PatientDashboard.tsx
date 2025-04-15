import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { adminService, Patient, LabTestSet } from "../../services/admin";
import { authService } from "../../services/auth";
import { formatDate } from "../../utils/dateFormatter";
import { UserIcon } from "../icons/UserIcon";
import { LabTestIcon } from "../icons/LabTestIcon";
import labTestImage from "../../assets/lab-test.jpeg";
import { Interpretation } from "../Interpretation";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Pagination } from "../ui/Pagination";

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
  const navigate = useNavigate();
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    total: 0,
    page: 1,
    page_size: 2,
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
      if (!labSet) return;

      const observationPromises = labSet.observations.map((obs) => adminService.getLabSetObservations(obs.id));
      const observationResults = await Promise.all(observationPromises);
      const allObservations = observationResults.flat();

      setObservations((prev) => ({ ...prev, [labSetId]: allObservations }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load observations:", err);
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

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
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
        {/* Header with curved edge */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden relative">
          {/* Curved shape on the right */}
          <div className="absolute top-0 right-0 h-full w-1/2">
            <div className="absolute inset-0 bg-gradient-to-l from-blue-50/80 to-white/20"></div>
            <svg
              className="absolute top-0 right-0 h-full w-32 text-white"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0 0 C 40 0 60 50 60 50 C 60 50 40 100 0 100 Z" />
            </svg>
          </div>

          {/* Content */}
          <div className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <UserIcon className="h-12 w-12 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Welcome, {patient?.first_name.toUpperCase()} {patient?.last_name.toUpperCase()}
                  </h1>
                  <div className="text-sm font-medium text-blue-600 mt-1">
                    {patient ? calculateAge(patient.birth_date) : "--"}
                  </div>
                  <br></br>
                  <p className="text-xl text-slate-600 mt-2">
                    Here are your lab test results and their interpretations
                  </p>
                  <div className="text-sm text-slate-500 mt-2">
                    Last updated: {formatDate(lastUpdated.toISOString(), "DD.MM.YYYY HH:mm")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Background image positioned absolutely */}
          <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none">
            <img
              src={labTestImage}
              alt="Lab equipment"
              className="h-full w-full object-cover object-center opacity-90"
              style={{
                maskImage: "linear-gradient(to left, black 40%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 100%)",
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
              to={`/upload/${fhirId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              Upload more tests
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
                <div key={testSet.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Lab Set Header - always visible */}
                  <div
                    className="p-6 border-b border-slate-200 cursor-pointer hover:bg-slate-50/80 transition-colors duration-200"
                    onClick={() => {
                      if (expandedSetId !== testSet.id) {
                        setExpandedSetId(testSet.id);
                        loadObservationsForSet(testSet.id);
                      } else {
                        setExpandedSetId(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <LabTestIcon className="h-5 w-5 text-blue-600" />
                          <h3 className="text-md font-semibold text-slate-900">
                            Lab set from {formatDate(testSet.test_date)}
                          </h3>
                          <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full ring-1 ring-blue-700/10">
                            {testSet.observations.length} tests
                          </span>

                          {!testSet.interpretation && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded-full ring-1 ring-orange-700/10">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3.5 h-3.5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Needs interpretation
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSetId(testSet.id);
                              setShowDeleteConfirm(true);
                            }}
                            disabled={isDeletingSet}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50 transition-colors duration-200"
                            title="Delete lab set"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            {isDeletingSet && deletingSetId === testSet.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {testSet.observations.slice(0, 3).map((obs, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700"
                            >
                              {obs.name}
                            </span>
                          ))}
                          {testSet.observations.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-600/10">
                              +{testSet.observations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-blue-400 transform transition-transform duration-200 ${
                          expandedSetId === testSet.id ? "rotate-180" : ""
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedSetId === testSet.id && (
                    <>
                      {/* Results Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Test
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Value
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Unit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Reference Range
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {(loadingInitialObservations && testSet.id === labTestSets[0]?.id) ||
                            !observations[testSet.id]
                              ? // Show loading skeleton rows
                                TableSkeleton
                              : observations[testSet.id].map((observation) => (
                                  <tr key={observation.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                      {observation.code.text}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                      {observation.valueQuantity?.value || observation.valueString || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {observation.valueQuantity?.unit || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {observation.referenceRange?.[0]?.text ||
                                        (observation.referenceRange?.[0] &&
                                          (observation.referenceRange[0].low && observation.referenceRange[0].high
                                            ? `${observation.referenceRange[0].low.value} - ${observation.referenceRange[0].high.value}`
                                            : observation.referenceRange[0].low
                                            ? `>${observation.referenceRange[0].low.value}`
                                            : observation.referenceRange[0].high
                                            ? `<${observation.referenceRange[0].high.value}`
                                            : "N/A")) ||
                                        "N/A"}
                                    </td>
                                  </tr>
                                ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Interpretation Section */}
                      <div className="p-6 bg-slate-50">
                        {(loadingInitialObservations && testSet.id === labTestSets[0]?.id) ||
                        !observations[testSet.id] ? (
                          <InterpretationSkeleton />
                        ) : testSet.interpretation ? (
                          <Interpretation content={testSet.interpretation} />
                        ) : (
                          <div className="text-sm text-slate-500 py-2">
                            <div>No interpretation available.</div>
                            <button
                              onClick={() => handleInterpret(testSet.id)}
                              disabled={interpretingSetId === testSet.id}
                              className="inline-flex items-center mt-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {interpretingSetId === testSet.id ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Interpreting...
                                </>
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Interpret now
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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

        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmLabel="Logout"
          cancelLabel="Cancel"
          variant="primary"
        />
      </div>
    </div>
  );
}

// Loading skeleton for interpretation
const InterpretationSkeleton = () => (
  <>
    <div className="flex gap-3 mb-3">
      <UserIcon className="h-5 w-5 text-blue-600" />
      <h4 className="text-sm font-semibold text-slate-900">Interpretation</h4>
    </div>
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-300 rounded w-3/4"></div>
      <div className="h-4 bg-slate-300 rounded w-1/2"></div>
      <div className="h-4 bg-slate-300 rounded w-2/3"></div>
    </div>
  </>
);

// Loading skeleton for table rows
const TableSkeleton = Array.from({ length: 4 }).map((_, i) => (
  <tr key={i} className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-slate-300 rounded w-32"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-slate-300 rounded w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-slate-300 rounded w-12"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-slate-300 rounded w-24"></div>
    </td>
  </tr>
));
