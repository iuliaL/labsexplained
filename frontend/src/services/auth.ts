import { apiRequest } from "../utils/api";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  fhir_id?: string;
  role?: string;
}

const LOCALHOST = "http://localhost:8000";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || LOCALHOST;

if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn(`REACT_APP_API_BASE_URL is not defined in environment variables. Using fallback: ${LOCALHOST}`);
}

// Helper function to get the auth token from cookies
const getAuthToken = (): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1] || null
  );
};

// Helper function to set the auth token in cookies
const setAuthToken = (token: string) => {
  // Set cookie to expire in 1 hour
  const expires = new Date();
  expires.setTime(expires.getTime() + 60 * 60 * 1000);
  const isSecure = process.env.NODE_ENV === "production";
  document.cookie = `jwt=${token}; expires=${expires.toUTCString()}; path=/${isSecure ? "; Secure" : ""}`;
};

// Helper function to get the auth role from cookies
const getAuthRole = (): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1] || null
  );
};

// Helper function to set the auth role in cookies
const setAuthRole = (role: string) => {
  // Set cookie to expire in 1 hour
  const expires = new Date();
  expires.setTime(expires.getTime() + 60 * 60 * 1000);
  document.cookie = `role=${role}; expires=${expires.toUTCString()}; path=/`;
};

// Helper function to get the auth FHIR ID from cookies
const getAuthFhirId = (): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("fhir_id="))
      ?.split("=")[1] || null
  );
};

// Helper function to set the auth FHIR ID in cookies
const setAuthFhirId = (fhirId: string) => {
  // Set cookie to expire in 1 hour
  const expires = new Date();
  expires.setTime(expires.getTime() + 60 * 60 * 1000);
  document.cookie = `fhir_id=${fhirId}; expires=${expires.toUTCString()}; path=/`;
};

// Helper function to remove all auth data from cookies
const removeAuthData = () => {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = `jwt=; ${expired}`;
  document.cookie = `role=; ${expired}`;
  document.cookie = `fhir_id=; ${expired}`;
};

export const authService = {
  getAuthToken,
  setAuthToken,
  getAuthRole,
  getAuthFhirId,
  setAuthRole,
  setAuthFhirId,
  removeAuthData,

  async checkEmailExists(email: string): Promise<boolean> {
    const params = new URLSearchParams({ email });
    const data = await apiRequest<{ exists: boolean }>(`${API_BASE_URL}/auth/check-email?${params}`);
    return data.exists;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email); // 👈 key must be "username"
    formData.append("password", password);
    try {
      const data = await apiRequest<LoginResponse>(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Store all auth data in cookies
      setAuthToken(data.access_token);
      if (data.role) setAuthRole(data.role);
      if (data.fhir_id) setAuthFhirId(data.fhir_id);

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred. Please try again later.");
    }
  },

  logout(): void {
    try {
      removeAuthData();
    } catch (error) {
      console.error("Error during logout:", error);
      removeAuthData();
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },
};
