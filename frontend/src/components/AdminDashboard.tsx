import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../services/admin";
import { formatDate } from "../utils/dateFormatter";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await adminService.getPatients();
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (fhirId: string) => {
    navigate(`/admin/patients/${fhirId}`);
  };

  const handleDeleteClick = (fhirId: string) => {
    setSelectedPatientId(fhirId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatientId) return;

    setIsDeletingPatient(true);
    setShowDeleteConfirm(false); // Close the dialog immediately when starting deletion
    try {
      console.log("Attempting to delete patient with FHIR ID:", selectedPatientId);
      await adminService.deletePatient(selectedPatientId);
      console.log("Patient deleted successfully");
      await fetchPatients(); // Refresh the list
    } catch (err) {
      console.error("Delete patient error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete patient";
      setError(errorMessage);
      // Show the error for 3 seconds then clear it
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDeletingPatient(false);
      setSelectedPatientId(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Patient Dashboard</h1>

      <div className="grid gap-4">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {patient.first_name} {patient.last_name}
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-slate-500">Born: {formatDate(patient.birth_date)}</span>
                    <span className="text-sm text-slate-500">
                      Gender: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </span>
                    <span className="text-sm text-slate-500">FHIR ID: {patient.fhir_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteClick(patient.fhir_id)}
                  disabled={isDeletingPatient}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50 transition-colors duration-200"
                  title="Delete patient"
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
                  Delete
                </button>
                <button
                  onClick={() => handleViewPatient(patient.fhir_id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        message="Are you sure you want to delete this patient? This action cannot be undone and will also delete all associated lab test sets."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* Loading overlay for deletion */}
      {isDeletingPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-4 pointer-events-auto">
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
              <h3 className="text-lg font-medium text-slate-900 mb-2">Deleting patient</h3>
              <p className="text-sm text-slate-500 text-center">Removing the patient and all associated data...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
