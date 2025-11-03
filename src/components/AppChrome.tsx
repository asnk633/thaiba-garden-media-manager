"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";

/**
 * Renders BottomNav + FAB only when:
 *  - user is signed in, and
 *  - route is NOT an auth route (/login, /register, /auth/*)
 *
 * Both FAB + BottomNav are centered off the same anchor so the + sits perfectly above the nav.
 */
export default function AppChrome() {
  const pathname = usePathname() ?? "/";
  const { user } = useAuth();

  const hideOnAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth");

  if (!user || hideOnAuthRoute) return null;

  return (
    <>
      {/* spacer to avoid content being covered by fixed nav */}
      <div className="bottom-nav-spacer" aria-hidden />

      {/* Shared anchor: both BottomNav and FAB center off this */}
      <div
        className="
          app-chrome-anchor fixed left-1/2 -translate-x-1/2 bottom-3
          w-[min(680px,calc(100%_-_16px))]
          z-[55] pointer-events-none
        "
      >
        <BottomNav className="pointer-events-auto" />
      </div>
    </>
  );
}
