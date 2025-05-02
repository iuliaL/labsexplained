import React from "react";
import { formatDate } from "../../utils/dateFormatter";
import { Interpretation } from "../Interpretation";
import { LabTestIcon } from "../icons/LabTestIcon";
import { LabTestSet } from "../../services/admin";
import { UserIcon } from "../icons/UserIcon";
import LabSetIcon from "../icons/LabSetIcon";

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
  testSet: LabTestSet;
  observations: Observation[] | null;
  isLoadingResults: boolean;
  isDeleting: boolean;
  isExpanded: boolean;
  isInterpreting: boolean;
  onDelete: () => void;
  onInterpret: () => void;
  onExpand: () => void;
}

export function LabSet({
  testSet,
  observations,
  isLoadingResults,
  isDeleting,
  isExpanded,
  isInterpreting,
  onDelete,
  onExpand,
  onInterpret,
}: LabSetProps) {
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Lab Set Header - always visible */}
        <div
          className="p-4 sm:p-6 border-b border-slate-200 cursor-pointer hover:bg-slate-50/80 transition-colors duration-200"
          onClick={onExpand}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <LabSetIcon className="h-5 w-5 text-blue-600" />

                <h3 className="text-sm sm:text-lg font-semibold text-slate-900 sm:text-md -ml-2 sm:ml-0">
                  <span className="sm:inline hidden">Lab set from</span> {formatDate(testSet.test_date)}
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full ring-1 ring-blue-700/10 flex items-center gap-1">
                  <LabTestIcon className="h-4 w-4 text-blue-600" />
                  {testSet.observations.length}
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
                    onDelete();
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50 transition-colors duration-200 sm:flex sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs sm:font-medium sm:text-red-600 sm:bg-red-50 sm:hover:bg-red-100 sm:rounded-md sm:disabled:opacity-50 sm:transition-colors sm:duration-200"
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
                  <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete"}</span>
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
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    +{testSet.observations.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <div
              className={`text-blue-400 transform transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              } flex self-start sm:self-center`}
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
        {isExpanded && (
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
                  {/*  Loading Skeleton for first lab set when loading the page*/}
                  {isLoadingResults ? (
                    TableSkeleton
                  ) : !Array.isArray(observations) || observations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">
                        No observations available
                      </td>
                    </tr>
                  ) : (
                    observations
                      .filter((observation) => observation && typeof observation === "object")
                      .map((observation) => (
                        <tr key={observation?.id || "unknown"} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {observation?.code?.text || "Unknown Test"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {observation?.valueQuantity?.value?.toString() || observation?.valueString || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {observation?.valueQuantity?.unit || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {(() => {
                              const range = observation?.referenceRange?.[0];
                              if (!range) return "N/A";

                              if (range.text) return range.text;

                              if (range.low?.value && range.high?.value) {
                                return `${range.low.value} - ${range.high.value}`;
                              }

                              if (range.low?.value) return `>${range.low.value}`;
                              if (range.high?.value) return `<${range.high.value}`;

                              return "N/A";
                            })()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Interpretation Section */}
            <div className="px-0 py-6 sm:p-6 bg-slate-50">
              {isLoadingResults || !observations ? (
                <InterpretationSkeleton />
              ) : testSet.interpretation ? (
                <Interpretation content={testSet.interpretation} />
              ) : (
                <div className="text-sm text-slate-500 py-2">
                  <div>No interpretation available.</div>
                  <button
                    onClick={onInterpret}
                    disabled={isInterpreting}
                    className="inline-flex items-center mt-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInterpreting ? (
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
    </>
  );
}

// Loading skeleton for interpretation
export const InterpretationSkeleton = () => (
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
export const TableSkeleton = Array.from({ length: 4 }).map((_, i) => (
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
