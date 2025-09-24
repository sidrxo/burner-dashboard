"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type AppUser = {
  uid: string;
  email: string | null;
  role: "siteAdmin" | "venueAdmin" | "subAdmin" | "user";
  venueId?: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // First try to get admin data from /admins collection
          const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: data.role,
              venueId: data.venueId || null,
            });
          } else {
            // If not found in admins, try users collection
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: data.role || "user",
                venueId: data.venueId || null,
              });
            } else {
              // Default to regular user if not found in either collection
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: "user",
                venueId: null,
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch user doc:", err);
          // Default to regular user on error
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "user",
            venueId: null,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}