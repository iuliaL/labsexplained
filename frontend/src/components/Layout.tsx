import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientWizard from "./PatientWizard";
import { AdminDashboard } from "./AdminDashboard";
import { PatientDetails } from "./PatientDetails";
import { PatientDashboard } from "./PatientDashboard";
import { ProtectedRoute } from "./ProtectedRoute";

export function Layout() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<PatientWizard />} />
          <Route path="/patient/:fhirId" element={<PatientDashboard />} />
          <Route
            path="/admin/patients"
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
                <PatientDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
