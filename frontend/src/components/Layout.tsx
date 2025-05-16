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
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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

            {/* Protected patient routes */}
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
            <Route
              path="/wizard/name/:fhirId"
              element={
                <ProtectedRoute validateFhirId>
                  <PatientWizard initialStep="name" />
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

            <Route
              path="/wizard/demographics/:fhirId"
              element={
                <ProtectedRoute validateFhirId>
                  <PatientWizard initialStep="demographics" />
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
