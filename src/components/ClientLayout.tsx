// src/components/ClientLayout.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/TopBar";
// BottomNav intentionally removed from ClientLayout.
// Navigation (BottomNav) + FAB live in the shell layout at:
// src/app/(shell)/layout.tsx — keep a single source-of-truth there.

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth();
  const canCreateEvent = hasRole ? hasRole(["admin", "team"]) : false;
  const isAdmin = hasRole ? hasRole(["admin"]) : false;

  return (
    <>
      <TopBar />
      <main className="pt-16">{children}</main>
      {/* BottomNav removed here to avoid duplicate FAB. See shell layout for navigation. */}
    </>
  );
}