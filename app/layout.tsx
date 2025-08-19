"use client";

import "./globals.css";
import { AppNavbar } from "@/components/app-navbar";
import { Toaster } from "sonner";
import RequireAuth from "@/components/require-auth";
import { AuthProvider } from "@/components/useAuth";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <RequireAuth>
            <div className="min-h-screen flex flex-col">
              <AppNavbar />
              <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
                {children}
              </main>
            </div>
          </RequireAuth>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
