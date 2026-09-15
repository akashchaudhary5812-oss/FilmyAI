"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, LoginPayload, RegisterPayload } from "@/types/user";
import { authApi } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session from storage
    try {
      const storedUser = authApi.getCurrentUser();
      if (storedUser && authApi.isAuthenticated()) {
        setUser(storedUser);
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    if (result.user) {
      setUser(result.user);
    } else {
      // Fallback user object
      const fallbackUser: User = {
        id: "usr_" + btoa(payload.email).substring(0, 10),
        email: payload.email,
        username: payload.email.split("@")[0],
      };
      setUser(fallbackUser);
    }
  };

  const register = async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);
    if (result.user) {
      setUser({
        id: result.user._id,
        username: result.user.username,
        email: result.user.email,
      });
      // Auto-login or store token if returned
      if (result.token) {
        localStorage.setItem("filmy_auth_token", result.token);
      }
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
