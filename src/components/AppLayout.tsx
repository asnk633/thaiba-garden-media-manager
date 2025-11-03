// src/components/AppLayout.tsx
"use client";

import React from "react";
import TopBar from "@/components/TopBar";       // default import (fixed)
import BottomNav from "@/components/BottomNav"; // has centered + FAB

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
