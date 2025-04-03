import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientWizard from "./PatientWizard";
import { AdminDashboard } from "./AdminDashboard";
import { PatientDetail } from "./PatientDetails";
import { ProtectedRoute } from "./ProtectedRoute";

export function Layout() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<PatientWizard />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients/:fhirId"
            element={
              <ProtectedRoute requiredRole="admin">
                <PatientDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
