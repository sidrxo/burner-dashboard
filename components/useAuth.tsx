"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser, getAuth } from "firebase/auth";
import { httpsCallable, getFunctions } from "firebase/functions";
import { initializeApp, getApps } from "firebase/app";

type AppUser = {
  uid: string;
  email: string | null;
  role: "siteAdmin" | "venueAdmin" | "subAdmin" | "user";
  venueId?: string | null;
  active: boolean;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  refreshUser: async () => {}
});

// Initialize Firebase completely within this file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const functions = getFunctions(app);
const auth = getAuth(app);

// Helper function to validate role type
function isValidRole(role: any): role is "siteAdmin" | "venueAdmin" | "subAdmin" | "user" {
  return typeof role === 'string' && 
         ['siteAdmin', 'venueAdmin', 'subAdmin', 'user'].includes(role);
}

// Helper function to validate venueId type
function isValidVenueId(venueId: any): venueId is string | null {
  return typeof venueId === 'string' || venueId === null || venueId === undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const extractUserFromToken = async (firebaseUser: FirebaseUser): Promise<AppUser> => {
    try {
      // Force refresh the ID token to get latest custom claims
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const claims = idTokenResult.claims;

      console.log("Extracted claims from token:", claims);

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: isValidRole(claims.role) ? claims.role : "user",
        venueId: isValidVenueId(claims.venueId) ? claims.venueId : null,
        active: claims.active !== false,
      };
    } catch (error) {
      console.error("Error getting ID token:", error);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: "user",
        venueId: null,
        active: true,
      };
    }
  };

  const validateAndSyncUser = async (firebaseUser: FirebaseUser): Promise<AppUser | null> => {
    try {
      // First try to get custom claims from the token directly
      const userWithClaims = await extractUserFromToken(firebaseUser);
      
      console.log("User from token extraction:", userWithClaims);
      
      // If user already has admin claims, return immediately
      if (userWithClaims.role !== 'user') {
        console.log("User has admin claims:", userWithClaims.role);
        return userWithClaims;
      }

      // Only call validateUser function if user doesn't have claims or is a regular user
      console.log("User is regular user, attempting server validation...");
      
      try {
        const validateUser = httpsCallable(functions, 'validateUser');
        const result = await validateUser();
        
        if (result.data && (result.data as any).success) {
          const userData = (result.data as any).user;
          
          if (!userData.active) {
            console.log("User account is inactive, signing out");
            await auth.signOut();
            return null;
          }

          return {
            uid: userData.uid,
            email: userData.email,
            role: userData.role,
            venueId: userData.venueId,
            active: userData.active
          };
        } else {
          console.log("Server validation failed, using token claims");
          return userWithClaims;
        }
      } catch (funcError: any) {
        console.log("Server validation error:", funcError.message);
        
        if (funcError.code === 'functions/permission-denied' || 
            funcError.code === 'functions/unauthenticated') {
          console.log("User not authorized by server, signing out");
          await auth.signOut();
          return null;
        }
        
        // For other errors, fall back to token claims
        console.warn("Using token claims due to server error");
        return userWithClaims;
      }
    } catch (error: any) {
      console.error("Error in validateAndSyncUser:", error);
      
      // Fallback to basic user info
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: "user",
        venueId: null,
        active: true,
      };
    }
  };

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        console.log("Refreshing user...");
        // Force refresh the ID token to get latest custom claims
        await currentUser.getIdToken(true);
        const validatedUser = await validateAndSyncUser(currentUser);
        setUser(validatedUser);
        console.log("User refreshed:", validatedUser);
      } catch (error) {
        console.error("Error refreshing user:", error);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", !!firebaseUser);
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Wait a moment for custom claims to be available after login
          console.log("Waiting for claims to be available...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const validatedUser = await validateAndSyncUser(firebaseUser);
          setUser(validatedUser);
          console.log("Final user set:", validatedUser);
        } catch (error) {
          console.error("Error processing authenticated user:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}