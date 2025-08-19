import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LoginForm } from "./login-form"; // or wherever LoginForm is

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
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
        <LoginForm />
      </div>
    </div>
  );


  return <>{children}</>;
}
