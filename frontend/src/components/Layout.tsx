import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientWizard from "./PatientWizard";
import { PatientDashboard } from "./PatientDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { PatientDetails } from "./PatientDetails";

export default function Layout() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wizard Steps */}
        <Route path="/" element={<PatientWizard initialStep="welcome" />} />
        <Route path="/name" element={<PatientWizard initialStep="name" />} />
        <Route path="/demographics" element={<PatientWizard initialStep="demographics" />} />
        <Route path="/upload" element={<PatientWizard initialStep="upload" />} />
        <Route path="/upload/:fhirId" element={<PatientWizard initialStep="upload" />} />
        <Route path="/patient/:fhirId" element={<PatientDashboard />} />
        {/* Protected Routes */}
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
    </BrowserRouter>
  );
}
