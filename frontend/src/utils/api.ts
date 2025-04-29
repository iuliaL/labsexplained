import { authService } from "../services/auth";

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/check-email"];

interface RequestOptions extends RequestInit {
  isFormData?: boolean;
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = authService.getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      const isPublic = PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
      if (!isPublic) {
        window.dispatchEvent(new CustomEvent("session-expired"));
      }
      if (data && typeof data === "object" && "detail" in data) {
        throw new Error(data.detail as string);
      }
      throw new Error(isPublic ? "Invalid credentials" : "Unauthorized");
    }
    if (data && typeof data === "object" && "detail" in data) {
      throw new Error(data.detail as string);
    }
    throw new Error("An unexpected error occurred");
  }

  return data as T;
}
