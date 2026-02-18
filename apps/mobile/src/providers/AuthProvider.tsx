import React, { createContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "@react-native-firebase/auth";
import { type FirebaseAuthTypes } from "@react-native-firebase/auth";
import { doc, getDoc } from "@react-native-firebase/firestore";
import { auth, db } from "@/services/firebase";
import type { UserProfile } from "@palmtree/shared";

type User = FirebaseAuthTypes.User;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists) {
        setProfile({ id: snap.id, ...snap.data() } as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
