// src/app/(shell)/layout.tsx
"use client";

import React, { useState } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import FABOverlay from "@/components/FABOverlay";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";
import { RoleProvider } from "./RoleContext";
import { useRouter } from "next/navigation";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [fabOpen, setFabOpen] = useState(false);
  const [role] = React.useState<"admin" | "team" | "guest">("admin"); // TODO: wire to real auth
  const router = useRouter();

  const handleSelect = (action: string) => {
    // central routing for FAB actions
    if (action === "task") router.push("/tasks/new");
    else if (action === "event") router.push("/calendar/new");
    else if (action === "notice") router.push("/notifications/new");
    else if (action === "report") router.push("/reports");
    setFabOpen(false);
  };

  return (
    <RoleProvider>
      <ClientDataProvider>
        <div className="min-h-screen">
          <TopBar />
          <main className="pb-24 pt-4">{children}</main>

          {/* Center FAB trigger (single source of truth) */}
          <div className="fixed inset-x-0 bottom-[84px] z-40 flex justify-center pointer-events-none">
            <button
              onClick={() => setFabOpen((s) => !s)}
              aria-label="Create"
              className="pointer-events-auto h-16 w-16 rounded-full bg-[var(--tg-accent)] text-black text-3xl shadow-lg hover:scale-105 transform transition"
            >
              <span style={{ lineHeight: "56px", display: "inline-block" }}>+</span>
            </button>
          </div>

          {/* keep bottom nav (tabs only) */}
          <BottomNav />

          {/* FAB overlay (menu) */}
          <FABOverlay open={fabOpen} role={role} onClose={() => setFabOpen(false)} onSelect={handleSelect} />

          <ToastProvider />
        </div>
      </ClientDataProvider>
    </RoleProvider>
  );
}
