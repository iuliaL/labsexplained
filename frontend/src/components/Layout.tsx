import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PatientWizard from "./Patient/PatientWizard";
import { PatientDashboard } from "./Patient/PatientDashboard";
import { AdminDashboard } from "./Admin/AdminDashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { PatientDetails } from "./Admin/PatientDetails";
import { ResetPassword } from "./Auth/ResetPassword";
import Login from "./Auth/Login";

export default function Layout() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/wizard/email" element={<PatientWizard initialStep="email" />} />
        <Route path="/wizard/name" element={<PatientWizard initialStep="name" />} />
        <Route path="/wizard/demographics" element={<PatientWizard initialStep="demographics" />} />
        <Route path="/wizard/upload" element={<PatientWizard initialStep="upload" />} />

        {/* Protected admin routes */}
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

        {/* Protected patient routes */}
        <Route
          path="/patient/:fhirId"
          element={
            <ProtectedRoute validateFhirId>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wizard/upload/:fhirId"
          element={
            <ProtectedRoute validateFhirId>
              <PatientWizard initialStep="upload" />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
