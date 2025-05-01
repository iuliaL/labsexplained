import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, PaginationMetadata, Patient } from "../../services/admin";
import { formatDate } from "../../utils/dateFormatter";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Pagination } from "../ui/Pagination";
import AdminIcon from "../icons/AdminIcon";
import LabSetIcon from "../icons/LabSetIcon";
import { LabTestIcon } from "../icons/LabTestIcon";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  });

  useEffect(() => {
    fetchPatients(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchPatients = async (page: number) => {
    try {
      setLoading(true);
      const response = await adminService.getPatients(page, pagination.page_size);
      setPatients(response.patients);
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
      await adminService.deletePatient(selectedPatientId);
      await fetchPatients(pagination.page); // Refresh the list
    } catch (err) {
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full ring-1 ring-blue-700/10">
            {pagination.total} total
          </span>
          {pagination.total > pagination.page_size && (
            <span className="text-sm text-slate-500">(showing {pagination.page_size} per page)</span>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {patients.map((patient) => {
          const isAdmin = patient.is_admin;
          // TODO: remove this once we have the correct data in the database
          const lab_set_count = patient.lab_set_count || 0;
          const interpreted_count = patient.interpreted_count || 0;
          return (
            <div key={patient.fhir_id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col gap-2">
                {/* Main row: name, email, role, actions */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col gap-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                        {patient.first_name} {patient.last_name}
                      </h2>
                      <span
                        className={`px-2 py-0.5 text-xs sm:text-sm font-semibold rounded-full flex items-center gap-1 ${
                          isAdmin ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isAdmin && <AdminIcon width={12} height={12} className="inline-block"/>}
                        <span className="hidden sm:text-xs sm:inline">{isAdmin ? "Admin" : "Patient"}</span>
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500 mt-0.5">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                  {!patient.is_admin && (
                      <button
                        onClick={() => {
                          /* TODO: implement make admin */
                        }}
                        className="p-2 sm:px-2.5 sm:py-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1.5"
                        title="Make Admin"
                      >
                        <AdminIcon className="w-4 h-4" />
                        <span className="hidden sm:text-xs md:text-sm sm:inline">Make Admin</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(patient.fhir_id)}
                      disabled={isDeletingPatient}
                      className="p-2 sm:px-2.5 sm:py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50 flex items-center gap-1.5"
                      title="Delete patient"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
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
                      <span className="hidden  sm:text-xs md:text-sm sm:inline">Delete</span>
                    </button>
                    <button
                      onClick={() => handleViewPatient(patient.fhir_id)}
                      className="p-2 sm:px-3 sm:py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"
                      title="View Details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="hidden  sm:text-xs md:text-sm sm:inline">View Details</span>
                    </button>
           
                  </div>
                </div>
                {/* Info rows */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                  <div className="text-xs sm:text-sm text-slate-500">
                    <b>FHIR ID:</b> {patient.fhir_id}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">
                    <b>Gender:</b> {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">
                    <b>Born:</b> {formatDate(patient.birth_date)}
                  </div>
                </div>
                {/* Lab sets and interpreted count */}
                <div className="flex flex-wrap gap-x-2 sm:gap-x-4 gap-y-1 items-center mt-1 sm:mt-2">
                  <LabTestIcon className="text-blue-500 w-4 h-4" />
                  <span className="px-2 py-0.5 text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 rounded-full">
                    {lab_set_count} Lab sets
                  </span>
                  {interpreted_count === lab_set_count ? (
                    <span className="px-2 py-0.5 text-xs sm:text-sm font-medium bg-emerald-50 text-emerald-700 rounded-full">
                      {interpreted_count} Interpreted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs sm:text-sm font-medium bg-red-50 text-red-700 rounded-full">
                      {lab_set_count - interpreted_count} Not interpreted yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add pagination component */}
      <Pagination currentPage={pagination.page} totalPages={pagination.total_pages} onPageChange={handlePageChange} />

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
