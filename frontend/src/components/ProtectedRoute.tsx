import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "patient";
}

export function ProtectedRoute({ children, requiredRole = "patient" }: ProtectedRouteProps) {
  // TODO: Replace this with your actual auth check
  const isAuthenticated = true; // This should come from your auth context/state
  const userRole = "admin"; // This should come from your auth context/state

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
