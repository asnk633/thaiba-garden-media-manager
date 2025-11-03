// src/components/TopBar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Health = "unknown" | "healthy" | "error";

export default function TopBar() {
  const [health, setHealth] = useState<Health>("unknown");
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const ok = res.ok ? (await res.json())?.status === "healthy" : false;
        if (mounted) setHealth(ok ? "healthy" : "error");
      } catch { if (mounted) setHealth("error"); }
    };
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?userId=1&read=false&limit=5");
        if (mounted) setUnread(res.ok ? (await res.json()).length ?? 0 : 0);
      } catch { if (mounted) setUnread(0); }
    };
    fetchHealth(); fetchNotifications();
    const t1 = setInterval(fetchHealth, 60_000);
    const t2 = setInterval(fetchNotifications, 30_000);
    return () => { mounted = false; clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-black/60 backdrop-blur-md px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-3 w-3 rounded-full ${
            health === "healthy" ? "bg-emerald-500" : health === "error" ? "bg-red-500" : "bg-zinc-500"
          }`}
          title={`Server: ${health}`}
        />
        <span className="text-lg font-semibold">Thaiba Garden</span>
      </div>

      <nav className="flex items-center gap-3 text-white/80">
        <button aria-label="Theme" className="hover:text-white">🌙</button>
        <Link href="/updates" className="relative hover:text-white" aria-label="Notifications" title="Notifications">
          🔔
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-black">
              {unread}
            </span>
          )}
        </Link>
        <Link href="/profile" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm">AU</Link>
      </nav>
    </header>
  );
}
