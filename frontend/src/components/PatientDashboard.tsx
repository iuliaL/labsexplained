import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminService, Patient, LabTestSet } from "../services/admin";
import { formatDate } from "../utils/dateFormatter";
import { UserIcon } from "./icons/UserIcon";
import { LabTestIcon } from "./icons/LabTestIcon";
import labTestImage from "../assets/lab-test.jpeg";
import { Interpretation } from "./Interpretation";

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

  // Calculate age from birth date with months
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
      const monthString = months > 0 ? ` and ${months} month${months !== 1 ? "s" : ""}` : "";
      return `${years} year${years !== 1 ? "s" : ""}${monthString}`;
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
        const labTestData = await adminService.getPatientLabTests(fhirId);
        setLoading(false);
        setLabTestSets(labTestData);

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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with lab test background */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden relative">
          {/* Lab test image with gradient mask */}
          <div className="absolute inset-y-0 right-0">
            <img
              src={labTestImage}
              alt="Lab equipment"
              className="w-full h-full object-contain"
              style={{
                maskImage: "linear-gradient(to left, black, transparent)",
                WebkitMaskImage: "linear-gradient(to left, black, transparent)",
              }}
            />
          </div>

          <div className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <UserIcon className="h-12 w-12 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Welcome, {patient?.first_name.toUpperCase()} {patient?.last_name.toUpperCase()}
                </h1>
                <div className="text-sm font-medium text-blue-600 mt-1">
                  Your age is {patient ? calculateAge(patient.birth_date) : "--"}
                </div>
                <p className="text-slate-600 mt-2">Below are your lab test results and their interpretations</p>
                <div className="text-sm text-slate-500 mt-2">
                  Last updated: {formatDate(lastUpdated.toISOString(), "DD.MM.YYYY HH:mm")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Sets Section */}
        <div className="space-y-8">
          {labTestSets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-lg text-slate-600">No lab tests available yet</p>
              <p className="text-sm text-slate-500 mt-2">Check back later for your test results</p>
            </div>
          ) : (
            labTestSets.map((testSet) => (
              <div key={testSet.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Lab Set Header - always visible */}
                <div
                  className="p-6 border-b border-slate-200 cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    if (expandedSetId !== testSet.id) {
                      setExpandedSetId(testSet.id);
                      loadObservationsForSet(testSet.id);
                    } else {
                      setExpandedSetId(null);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LabTestIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Lab results from {formatDate(testSet.test_date)}
                      </h3>
                    </div>
                    <svg
                      className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 ${
                        expandedSetId === testSet.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
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
                      ) : (
                        <Interpretation content={testSet.interpretation || "Not interpreted yet"} />
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
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
