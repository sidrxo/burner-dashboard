"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/useAuth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestClaimsPage() {
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkToken = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        // Force refresh token and get claims
        const idTokenResult = await auth.currentUser.getIdTokenResult(true);
        setTokenInfo({
          claims: idTokenResult.claims,
          authTime: new Date(idTokenResult.authTime).toISOString(),
          issuedAtTime: new Date(idTokenResult.issuedAtTime).toISOString(),
          expirationTime: new Date(idTokenResult.expirationTime).toISOString(),
          signInProvider: idTokenResult.signInProvider,
        });
      }
    } catch (error) {
      console.error("Error getting token:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
  }, [user]);

  return (
    <div className="min-h-screen p-8 bg-background">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Custom Claims Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">User from useAuth Hook:</h3>
            <pre className="p-4 bg-black text-green-400 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <Button onClick={checkToken} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Token Info"}
          </Button>

          {tokenInfo && (
            <div>
              <h3 className="text-lg font-semibold mb-2">ID Token Claims:</h3>
              <pre className="p-4 bg-black text-green-400 rounded text-sm overflow-auto">
                {JSON.stringify(tokenInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Expected for Admin Access:</strong>
              <ul className="mt-2 text-muted-foreground">
                <li>• role: "siteAdmin"</li>
                <li>• active: true</li>
                <li>• Custom claims should be in ID token</li>
              </ul>
            </div>
            <div>
              <strong>Troubleshooting:</strong>
              <ul className="mt-2 text-muted-foreground">
                <li>• If claims are missing, try signing out/in</li>
                <li>• Token refresh may take a few minutes</li>
                <li>• Check Firebase Console for custom claims</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}