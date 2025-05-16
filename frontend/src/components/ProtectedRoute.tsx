import { useAuth } from "@contexts/AuthContext";
import React from "react";
import { Navigate, useParams } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "patient";
  validateFhirId?: boolean;
}

export function ProtectedRoute({ children, requiredRole, validateFhirId = false }: ProtectedRouteProps) {
  const { isAuthenticated, role, fhirId } = useAuth();
  const params = useParams();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only check role if requiredRole is specified
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === "admin" ? "/admin/patients" : `/patient/${fhirId}`} replace />;
  }

  // For patient routes, validate that the URL fhirId matches the authenticated user's fhirId
  if (validateFhirId && role === "patient" && params.fhirId !== fhirId) {
    return <Navigate to={`/patient/${fhirId}`} replace />;
  }

  return <>{children}</>;
}
