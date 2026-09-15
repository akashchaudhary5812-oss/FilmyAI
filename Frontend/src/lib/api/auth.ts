import { apiClient } from "./client";
import { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types/user";

export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/api/auth/register", payload);
    return response.data;
  },

  /**
   * Log in user
   * POST /api/auth/login
   */
  async login(payload: LoginPayload): Promise<{ message: string; token: string; user?: User }> {
    const response = await apiClient.post<{ message: string; token: string; user?: { _id: string; username: string; email: string } }>("/api/auth/login", payload);
    const { token, message } = response.data;

    if (token && typeof window !== "undefined") {
      localStorage.setItem("filmy_auth_token", token);
      const serverUser = response.data.user;
      const user: User = serverUser
        ? { id: serverUser._id, email: serverUser.email, username: serverUser.username }
        : { id: "usr_" + btoa(payload.email).substring(0, 10), email: payload.email, username: payload.email.split("@")[0] };
      localStorage.setItem("filmy_user_profile", JSON.stringify(user));
      return { message, token, user };
    }

    return { message, token };
  },

  /**
   * Log out current user
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("filmy_auth_token");
      localStorage.removeItem("filmy_user_profile");
      // Remove cookie if possible
      document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
  },

  /**
   * Get stored current user
   */
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("filmy_user_profile");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("filmy_auth_token");
  },
};
