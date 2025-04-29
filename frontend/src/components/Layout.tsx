import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PatientWizard from "./Patient/PatientWizard";
import { PatientDashboard } from "./Patient/PatientDashboard";
import { AdminDashboard } from "./Admin/AdminDashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { PatientDetails } from "./Admin/PatientDetails";
import { ResetPassword } from "./Auth/ResetPassword";
import Login from "./Auth/Login";
import NotFound from "./NotFound";
import { SessionProvider } from "../contexts/SessionContext";
import { AuthProvider } from "../contexts/AuthContext";
export default function Layout() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <Routes>
            {/* Root route */}
            <Route path="/" element={<Navigate to="/wizard" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Wizard routes */}
            <Route path="/wizard" element={<PatientWizard initialStep="welcome" />} />
            <Route path="/wizard/account" element={<PatientWizard initialStep="account" />} />
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

            {/* Not Found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
