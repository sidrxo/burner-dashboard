"use client";

import { useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { useAuth } from "@/components/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { initializeApp, getApps } from "firebase/app";

// Initialize Firebase if needed
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

export default function SetupAdminPage() {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const handleSetupAdmin = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const setupFirstAdmin = httpsCallable(functions, 'setupFirstAdmin');
      const result = await setupFirstAdmin({ adminEmail: email });
      
      const response = result.data as any;
      if (response.success) {
        toast.success(response.message);
        
        // Force refresh user to get new claims
        setTimeout(async () => {
          await refreshUser();
          window.location.href = "/overview";
        }, 2000);
      }
    } catch (error: any) {
      console.error("Setup error:", error);
      
      let errorMessage = "Failed to setup admin";
      if (error.code === 'functions/failed-precondition') {
        errorMessage = "Site admin already exists. Please contact existing admin.";
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = "Email must match your logged-in account";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup First Site Administrator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              No site administrators exist yet. Set up your account as the first site admin.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Current user: {user?.email} (Role: {user?.role})
            </p>
          </div>
          
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <Button 
            onClick={handleSetupAdmin} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Setting up..." : "Setup Site Admin"}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            This function will be disabled after the first admin is created.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}