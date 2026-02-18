import React, { createContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, removeToken } from "@/services/api";
import type { UserProfile } from "@palmtree/shared";

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser; profile: UserProfile }>("/auth/me");
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setUser(null);
      setProfile(null);
      await removeToken();
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchMe();
    }
  }, [user, fetchMe]);

  // Check for existing token on mount
  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      if (token) {
        await fetchMe();
      }
      setLoading(false);
    };
    init();
  }, [fetchMe]);

  const signIn = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: AuthUser; profile: UserProfile }>(
      "/auth/login",
      { email, password }
    );
    await setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const data = await api.post<{ token: string; user: AuthUser; profile: UserProfile }>(
      "/auth/register",
      { email, password, displayName: name }
    );
    await setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
  };

  const signOut = async () => {
    await removeToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
