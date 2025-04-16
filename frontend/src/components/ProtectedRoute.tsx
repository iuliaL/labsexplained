import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "patient";
  validateFhirId?: boolean;
}

export function ProtectedRoute({ children, requiredRole = "patient", validateFhirId = false }: ProtectedRouteProps) {
  const { isAuthenticated, role, fhirId } = useAuth();
  const params = useParams();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === "admin" ? "/admin/patients" : `/patient/${fhirId}`} replace />;
  }

  // For patient routes, validate that the URL fhirId matches the authenticated user's fhirId
  if (validateFhirId && role === "patient" && params.fhirId !== fhirId) {
    return <Navigate to={`/patient/${fhirId}`} replace />;
  }

  return <>{children}</>;
}
