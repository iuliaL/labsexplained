import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, LoginResponse } from "../services/auth";

interface AuthState {
  isAuthenticated: boolean;
  role?: "admin" | "patient";
  fhirId?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check if there's auth data in cookies on mount
    const token = authService.getAuthToken();
    const role = authService.getAuthRole();
    const fhirId = authService.getAuthFhirId();

    if (token) {
      setAuthState({
        isAuthenticated: true,
        role: role as "admin" | "patient" | undefined,
        fhirId: fhirId || undefined,
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      setAuthState({
        isAuthenticated: true,
        role: response.role as "admin" | "patient",
        fhirId: response.fhir_id,
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
    });
  };

  return <AuthContext.Provider value={{ ...authState, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
