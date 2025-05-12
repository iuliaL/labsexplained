import { authService } from "../services/auth";
import { getCookie } from "./cookies";
const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/check-email"];

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};

  // Detect body type and set Content-Type only when appropriate
  const isFormData = options.body instanceof FormData;
  const isURLEncoded = options.body instanceof URLSearchParams;

  if (options.body &&!isFormData && !isURLEncoded) {
    headers["Content-Type"] = "application/json";
  }

  const token = authService.getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Add CSRF token for state-changing requests
  if (options.method && options.method !== "GET") {
    const csrfToken = getCookie("csrf_token");
    // TODO: Remove this after testing
    console.log("csrf_token in cookies:", getCookie("csrf_token"));
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include", // ✅ Needed to include cookies!
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
    if (response.status === 403) {
      throw new Error("Access forbidden");
    }
    if (data && typeof data === "object" && "detail" in data) {
      throw new Error(data.detail as string);
    }
    throw new Error("An unexpected error occurred");
  }

  return data as T;
}
