import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../api/auth";
import type { AuthUser, UserRole } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role: "CANDIDATE" | "COMPANY") => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthDataToUser(data: any): AuthUser {
  if (data.user) return data.user;

  const roles: UserRole[] = Array.isArray(data.roles) ? data.roles : [];
  const primaryRole: UserRole =
    roles.includes("ROLE_SUPER_ADMIN") || data.accountType === "SUPER_ADMIN" ? "ROLE_SUPER_ADMIN" :
    roles.includes("ROLE_ADMIN") || data.accountType === "ADMIN" ? "ROLE_ADMIN" :
    roles.includes("ROLE_COMPANY") || data.accountType === "COMPANY" ? "ROLE_COMPANY" :
    "ROLE_CANDIDATE";

  return {
    userId: data.userId || "",
    email: data.email || "",
    fullName: data.displayName || data.fullName || (data.email ? data.email.split("@")[0] : "User"),
    accountType: data.accountType || "",
    role: primaryRole,
    roles: roles.length > 0 ? roles : [primaryRole],
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("authUser");
    if (token && storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const payload = data.data as any;
    const authUser = mapAuthDataToUser(payload);
    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("refreshToken", payload.refreshToken);
    localStorage.setItem("authUser", JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string, role: "CANDIDATE" | "COMPANY") => {
    const { data } = await authApi.register({ fullName, email, password, role });
    const payload = data.data as any;
    const authUser = mapAuthDataToUser(payload);
    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("refreshToken", payload.refreshToken);
    localStorage.setItem("authUser", JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* silent */ }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
    setUser(null);
  }, []);

  const hasRole = useCallback((role: UserRole) => {
    if (!user) return false;
    if (user.role === "ROLE_SUPER_ADMIN" || user.accountType === "SUPER_ADMIN") return true;
    return user.roles ? user.roles.includes(role) : user.role === role;
  }, [user]);

    const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return Boolean(
      user.role === "ROLE_SUPER_ADMIN" ||
      user.role === "ROLE_ADMIN" ||
      user.accountType === "SUPER_ADMIN" ||
      user.accountType === "ADMIN" ||
      (user.roles && (user.roles.includes("ROLE_ADMIN") || user.roles.includes("ROLE_SUPER_ADMIN")))
    );
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, hasRole, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

