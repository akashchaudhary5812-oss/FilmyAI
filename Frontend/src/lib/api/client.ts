import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

/**
 * Base API URL configured strictly via NEXT_PUBLIC_API_BASE_URL
 * Never hardcoded to localhost.
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor to attach JWT Authorization Bearer header if stored
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("filmy_auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize errors and handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with a non-2xx status code
      const data = error.response.data as { message?: string; error?: string };
      const errorMessage = data?.message || data?.error || `Request failed with status ${error.response.status}`;

      if (error.response.status === 401 && typeof window !== "undefined") {
        // Clear local token if unauthorized
        localStorage.removeItem("filmy_auth_token");
        localStorage.removeItem("filmy_user_profile");
      }

      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject(
        new Error(
          API_BASE_URL
            ? "Unable to reach the Filmy AI server. Please verify network connectivity."
            : "Backend API URL (NEXT_PUBLIC_API_BASE_URL) is not configured. Please check .env settings."
        )
      );
    } else {
      return Promise.reject(error);
    }
  }
);

/**
 * Optional secondary client for FastAPI report service
 */
const REPORT_API_BASE_URL = (process.env.NEXT_PUBLIC_REPORT_API_BASE_URL || "").trim();

export const reportClient: AxiosInstance = axios.create({
  baseURL: REPORT_API_BASE_URL || API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // Multimodal report generation can take 30-90 seconds
});
