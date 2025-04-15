interface LoginResponse {
  access_token: string;
  token_type: string;
  fhir_id?: string;
  role?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn("REACT_APP_API_BASE_URL is not defined in environment variables. Using fallback: http://localhost:8000");
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
  document.cookie = `jwt=${token}; expires=${expires.toUTCString()}; path=/`;
};

// Helper function to remove the auth token from cookies
const removeAuthToken = () => {
  document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const authService = {
  getAuthToken,

  async checkEmailExists(email: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${email}`);

    if (!response.ok) {
      throw new Error("Failed to check email");
    }

    const data = await response.json();
    return data.exists;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // For 401, we know the server sends the error in data.detail
          throw new Error("Invalid email or password. Please try again.");
        }

        // For other errors
        if (typeof data === "object" && data.detail) {
          throw new Error(data.detail);
        } else throw new Error("An error occurred while trying to log in. Please try again later.");
      }

      // Store the token in cookies
      setAuthToken(data.token);
      return data;
    } catch (error) {
      // If it's our error with a specific message, rethrow it
      if (error instanceof Error) {
        throw error;
      }
      // For unexpected errors
      throw new Error("An unexpected error occurred. Please try again later.");
    }
  },

  logout(): void {
    try {
      const token = getAuthToken();
      if (!token) return;
      // Remove the token from cookies
      removeAuthToken();
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if the server request fails, we still want to clear the token
      removeAuthToken();
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (typeof data === "object" && data.detail) {
        throw new Error(data.detail);
      }
      throw new Error("Failed to process password reset request. Please try again later.");
    }

    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (typeof data === "object" && data.detail) {
        throw new Error(data.detail);
      }
      throw new Error("Failed to reset password. Please try again later.");
    }

    return data;
  },
};
