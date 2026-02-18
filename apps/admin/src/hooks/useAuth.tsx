import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: string;
  addresses: any[];
  notificationPreferences: any;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .get<{ user: any; profile: UserProfile }>("/auth/me")
        .then((data) => {
          setUser(data.profile);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: any; profile: UserProfile }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    setUser(data.profile);
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
