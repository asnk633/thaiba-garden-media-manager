// src/components/BottomNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FAB from "@/components/FAB";
import { Home, CheckSquare, Calendar, Download, Bell, BarChart2 } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

export default function BottomNav({ isAdmin = false, canCreateEvent = false }: { isAdmin?: boolean; canCreateEvent?: boolean }) {
  const pathname = usePathname();

  // We removed Profile from bottom nav and renamed Updates -> Notifications
  // Final set (6 tabs) to keep symmetry with center FAB:
  const items: NavItem[] = [
    { href: "/home", label: "Home", icon: <Home size={18} /> },
    { href: "/tasks", label: "Tasks", icon: <CheckSquare size={18} /> },
    { href: "/calendar", label: "Calendar", icon: <Calendar size={18} /> },
    { href: "/downloads", label: "Downloads", icon: <Download size={18} /> },
    { href: "/notifications", label: "Notifications", icon: <Bell size={18} /> }, // renamed
    { href: "/reports", label: "Reports", icon: <BarChart2 size={18} /> },
  ];

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className="fixed left-0 right-0 bottom-0 z-40"
        style={{
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          className="rounded-t-2xl shadow-2xl"
          style={{
            width: "min(980px, 98%)",
            margin: "0 auto",
            background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          {items.map((it) => {
            const active = pathname === it.href || pathname?.startsWith(it.href + "/");
            return (
              <Link key={it.href} href={it.href} className="nav-item" style={{ textDecoration: "none", color: active ? "#2ee6b6" : "#cfcfcf", display: "flex", flexDirection: "column", alignItems: "center", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}>
                  {it.icon}
                </div>
                <span style={{ marginTop: 4 }}>{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FAB sits above bottom nav — imported from component */}
      <FAB />
    </>
  );
}