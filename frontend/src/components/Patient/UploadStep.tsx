import { DateInput } from "@ui/DateInput";
import React, { useState } from "react";

interface UploadStepProps {
  onBack: () => void;
  onSubmit: (data: { file: File | null; date: Date | null }) => void;
  loading?: boolean;
  error?: string;
  processingState?: {
    uploadLabTest: "pending" | "loading" | "completed" | "error";
    interpretResults: "pending" | "loading" | "completed" | "error";
    error?: string;
  };
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

export function UploadStep({
  onBack,
  onSubmit,

  loading = false,
  error = "",
  processingState,
}: UploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string>("");

  const handleFile = (file: File) => {
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      if (file.size > MAX_FILE_SIZE) {
        setFileSizeError("File size must be less than 1MB");
        setSelectedFile(null);
        return;
      }
      setFileSizeError("");
      setSelectedFile(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (loading && processingState) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-slate-900">Processing your lab results</h3>
          <p className="text-sm text-slate-500">This may take a few moments</p>
        </div>

        <div className="space-y-4">
          {/* Always show upload step */}
          <div className="flex items-center space-x-3">
            {processingState.uploadLabTest === "completed" ? (
              <div className="flex-shrink-0 h-5 w-5 text-green-500">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : processingState.uploadLabTest === "loading" ? (
              <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : (
              <div className="flex-shrink-0 h-5 w-5 text-slate-300">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
            )}
            <span
              className={`text-sm ${
                processingState.uploadLabTest === "completed"
                  ? "text-green-900"
                  : processingState.uploadLabTest === "loading"
                  ? "text-blue-900"
                  : "text-slate-500"
              }`}
            >
              Uploading lab results
            </span>
          </div>

          {/* Always show interpretation step */}
          <div className="flex items-center space-x-3">
            {processingState.interpretResults === "completed" ? (
              <div className="flex-shrink-0 h-5 w-5 text-green-500">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : processingState.interpretResults === "loading" ? (
              <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : (
              <div className="flex-shrink-0 h-5 w-5 text-slate-300">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
            )}
            <span
              className={`text-sm ${
                processingState.interpretResults === "completed"
                  ? "text-green-900"
                  : processingState.interpretResults === "loading"
                  ? "text-blue-900"
                  : "text-slate-500"
              }`}
            >
              Generating interpretation
            </span>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">Error processing your request</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Date picker */}
        <DateInput
          id="test-date"
          label="Lab set date"
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            // onDateSelect(date);
          }}
          required
          disabled={loading}
          maxDate={new Date()}
          error={error}
        />

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Upload lab results</label>
          {!selectedFile ? (
            <div
              className={`
                mt-1 flex justify-center px-6 pt-5 pb-6 
                border-2 border-dashed rounded-lg
                transition-colors duration-200
                ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50"
                    : fileSizeError
                    ? "border-red-300 bg-red-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onDragEnter={!loading ? handleDragIn : undefined}
              onDragLeave={!loading ? handleDragOut : undefined}
              onDragOver={!loading ? handleDrag : undefined}
              onDrop={!loading ? handleDrop : undefined}
            >
              <div className="space-y-1 text-center">
                <div className="flex justify-center space-x-4">
                  {/* PDF icon */}
                  <svg className="h-12 w-12 text-slate-400" viewBox="0 0 48 48" fill="none" stroke="currentColor">
                    <path
                      d="M12 8v32a4 4 0 004 4h16a4 4 0 004-4V16L24 8h-12z"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M24 8v8h8M17 25h14M17 31h14"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {/* Image icon */}
                  <svg className="h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex text-sm text-slate-600">
                  <label
                    className={`relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none ${
                      loading ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">PDF or image files (max 1MB)</p>
                {fileSizeError && <p className="text-xs text-red-600 mt-2">{fileSizeError}</p>}
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center space-x-3 px-4 py-3 border border-slate-200 rounded-lg bg-slate-50">
              {/* Show appropriate icon based on file type */}
              {selectedFile.type === "application/pdf" ? (
                <svg className="h-8 w-8 text-slate-400" viewBox="0 0 48 48" fill="none" stroke="currentColor">
                  <path
                    d="M12 8v32a4 4 0 004 4h16a4 4 0 004-4V16L24 8h-12z"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M24 8v8h8M17 25h14M17 31h14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <label
                className={`cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500 ${
                  loading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Change file
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium">Error processing your request</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ file: selectedFile, date: selectedDate })}
          disabled={!selectedFile || !selectedDate || loading || !!fileSizeError}
          className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-400"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Processing...
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
