// src/app/layout.tsx
"use client";

import React from "react";
import BottomNav from "@/components/BottomNav";
import { FAB } from "@/components/FAB";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "@/app/(shell)/ClientDataContext";
import { RoleProvider } from "@/app/(shell)/RoleContext";
// 🎯 Import the AuthProvider from the correct path
import { AuthProvider } from "@/contexts/AuthContext";

// 🎯 Ensure globals.css is imported here
import './globals.css';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    // 🎯 Wrap all other providers with AuthProvider
    <AuthProvider>
      <RoleProvider>
        <ToastProvider>
          <ClientDataProvider>
            <html lang="en">
              <body className="min-h-screen">
                <main className="pb-24 pt-4">{children}</main>

                {/* Put FAB here so it's centered above the BottomNav */}
                <FAB />

                {/* Bottom navigation remains single-source-of-truth */}
                <BottomNav isAdmin={true} canCreateEvent={true} />
              </body>
            </html>
          </ClientDataProvider>
        </ToastProvider>
      </RoleProvider>
    </AuthProvider>
  );
}