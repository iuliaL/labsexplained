import { AdminDashboard } from "@components/Admin/AdminDashboard";
import { PatientDetails } from "@components/Admin/PatientDetails";
import Login from "@components/Auth/Login";
import { ResetPassword } from "@components/Auth/ResetPassword";
import NotFound from "@components/NotFound";
import { PatientDashboard } from "@components/Patient/PatientDashboard";
import PatientWizard from "@components/Patient/PatientWizard";
import { ProtectedRoute } from "@components/ProtectedRoute";
import { AuthProvider } from "@contexts/AuthContext";
import { SessionProvider } from "@contexts/SessionContext";
import ProtectedContainer from "@ui/ProtectedContainer";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

export default function Layout() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <DocumentTitleUpdater />
          <Routes>
            {/* Root route */}
            <Route path="/" element={<Navigate to="/wizard" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Wizard routes */}
            <Route path="/wizard" element={<PatientWizard initialStep="welcome" />} />
            <Route path="/wizard/account" element={<PatientWizard initialStep="account" />} />

            <Route
              path="/wizard/name/:fhirId"
              element={
                <ProtectedRoute validateFhirId>
                  <PatientWizard initialStep="name" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wizard/demographics/:fhirId"
              element={
                <ProtectedRoute validateFhirId>
                  <PatientWizard initialStep="demographics" />
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

            {/* Patient Dashboard route */}
            <Route element={<ProtectedContainer />}>
              <Route
                path="/patient/:fhirId"
                element={
                  <ProtectedRoute validateFhirId>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Protected admin routes */}
            <Route element={<ProtectedContainer />}>
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
            </Route>

            {/* Not Found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function DocumentTitleUpdater() {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = "LabsExplained";
    // Add specific titles based on routes
    if (pathname.startsWith("/wizard")) {
      if (pathname === "/wizard/account") title = "Create Account | LabsExplained";
      else if (pathname.startsWith("/wizard/name")) title = "Patient Information | LabsExplained";
      else if (pathname.startsWith("/wizard/demographics")) title = "Patient Demographics | LabsExplained";
      else if (pathname.startsWith("/wizard/upload")) title = "Upload Lab Results | LabsExplained";
      else title = "Welcome | LabsExplained";
    } else if (pathname.startsWith("/admin/patients")) {
      if (pathname === "/admin/patients") title = "Admin Dashboard | LabsExplained";
      else title = "Patient Details | LabsExplained";
    } else if (pathname.startsWith("/patient/")) title = "Patient Dashboard | LabsExplained";
    else if (pathname === "/login") title = "Login | LabsExplained";
    else if (pathname === "/reset-password") title = "Reset Password | LabsExplained";
    else if (pathname === "/404") title = "Page Not Found | LabsExplained";

    document.title = title;
  }, [pathname]);
  return null;
}
