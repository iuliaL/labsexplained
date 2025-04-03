import React, { useState } from "react";
import { formatDate } from "../utils/dateFormatter";
import { Interpretation } from "./Interpretation";
import { adminService } from "../services/admin";

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

interface LabSetProps {
  id: string;
  testDate: string;
  observations: Array<{ id: string; name: string }>;
  interpretation: string | null;
  className?: string;
}

export function LabSet({ id, testDate, observations = [], interpretation, className = "" }: LabSetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullObservations, setFullObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure observations is an array and extract test names
  const safeObservations = Array.isArray(observations) ? observations : [];
  const testNames = safeObservations.map((obs) => obs.name);
  const previewTests = testNames.slice(0, 3);
  const remainingTests = Math.max(0, testNames.length - 3);

  const handleExpand = async () => {
    if (!isExpanded && fullObservations.length === 0) {
      setLoading(true);
      setError(null);
      try {
        // Fetch each observation individually
        const observationPromises = safeObservations.map((obs) => adminService.getLabSetObservations(obs.id));
        const observationResults = await Promise.all(observationPromises);
        // Flatten the array of arrays into a single array
        const allObservations = observationResults.flat();
        setFullObservations(allObservations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load test results");
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <details
      className={`group bg-slate-50 hover:bg-blue-50/50 rounded-lg transition-colors duration-200 ${className}`}
      open={isExpanded}
      onToggle={handleExpand}
    >
      <summary className="p-6 cursor-pointer list-none">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-md font-semibold text-slate-900">Set from {formatDate(testDate)}</h3>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full ring-1 ring-indigo-700/10">
                {safeObservations.length} tests
              </span>
            </div>
            <div className="flex flex-wrap gap-2 group-open:hidden">
              {previewTests.map((testName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700"
                >
                  {testName}
                </span>
              ))}
              {remainingTests > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-600/10">
                  +{remainingTests} more
                </span>
              )}
            </div>
          </div>
          <div className="text-indigo-400 group-open:rotate-180 transition-transform duration-200">
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
      </summary>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="text-sm text-slate-500">Loading test results...</div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 py-2">{error}</div>
        ) : (
          fullObservations.length > 0 && (
            <>
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Test Results</h4>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
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
                      {fullObservations.map((observation) => (
                        <tr key={observation.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {observation.code.text}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {observation.valueQuantity
                              ? observation.valueQuantity.value
                              : observation.valueString || "N/A"}
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
              </div>

              {interpretation ? (
                <Interpretation content={interpretation} />
              ) : (
                <div className="text-sm text-slate-500 py-2">
                  <div>No interpretation available.</div>
                  <button className="inline-flex items-center mt-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150">
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
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </details>
  );
}
