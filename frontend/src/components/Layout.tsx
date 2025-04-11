import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientWizard from "./Patient/PatientWizard";
import { PatientDashboard } from "./Patient/PatientDashboard";
import { AdminDashboard } from "./Admin/AdminDashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { PatientDetails } from "./Admin/PatientDetails";

export default function Layout() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wizard Steps */}
        <Route path="/" element={<PatientWizard initialStep="welcome" />} />
        <Route path="/wizard" element={<PatientWizard initialStep="welcome" />} />
        <Route path="/wizard/email" element={<PatientWizard initialStep="email" />} />
        <Route path="/wizard/name" element={<PatientWizard initialStep="name" />} />
        <Route path="/wizard/demographics" element={<PatientWizard initialStep="demographics" />} />
        <Route path="/wizard/upload" element={<PatientWizard initialStep="upload" />} />
        <Route path="/wizard/upload/:fhirId" element={<PatientWizard initialStep="upload" />} />
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
