"use client";

import { useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { useAuth } from "@/components/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeApp, getApps } from "firebase/app";

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

export default function DebugAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const debugAdmins = httpsCallable(functions, 'debugAdmins');
      const result = await debugAdmins();
      
      const response = result.data as any;
      if (response.success) {
        setDebugData(response.data);
        console.log("Debug data:", response.data);
      }
    } catch (error: any) {
      console.error("Debug error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Debug Admin Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Current user: {user?.email} (Role: {user?.role})
            </p>
          </div>
          
          <Button 
            onClick={handleDebug} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Checking..." : "Check Admin Status"}
          </Button>
          
          {debugData && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-bold mb-2">Debug Results:</h3>
              <div className="text-sm space-y-2">
                <p><strong>Total Admins:</strong> {debugData.totalAdmins}</p>
                <p><strong>Active Site Admins:</strong> {debugData.activeSiteAdmins}</p>
                <p><strong>Your User ID:</strong> {debugData.currentUserId}</p>
                <p><strong>Your Custom Claims:</strong> {JSON.stringify(debugData.currentUserClaims, null, 2)}</p>
                
                <div className="mt-4">
                  <strong>All Admins in Database:</strong>
                  <pre className="mt-2 p-2 bg-black text-green-400 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.allAdmins, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}