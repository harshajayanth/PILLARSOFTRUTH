import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthUser } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthContextType {
  user: AuthUser | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}


const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/me'],
    queryFn: () =>
      apiRequest("GET", "/api/auth/me").then((res) =>
        res.ok ? res.json() : null
      ),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/login"),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    },
  });

  const login = () => {
    loginMutation.mutate();
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
