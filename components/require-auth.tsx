"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LoginForm } from "components/login-form"; // or wherever LoginForm is

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      // Reset inactive state when auth state changes
      if (!u) {
        setIsInactive(false);
      }
    });

    // Listen for custom event when user is signed out due to inactivity
    const handleInactiveUser = () => {
      setIsInactive(true);
    };

    window.addEventListener('userInactive', handleInactiveUser);
    
    return () => {
      unsubscribe();
      window.removeEventListener('userInactive', handleInactiveUser);
    };
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="w-full max-w-sm p-6">
          {isInactive && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              Your account has been deactivated. Please contact an administrator.
            </div>
          )}
          <LoginForm />
        </div>
      </div>
    );

  return <>{children}</>;
}