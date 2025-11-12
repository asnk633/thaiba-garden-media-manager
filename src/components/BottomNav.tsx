// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const Tab = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center gap-1 ${
          active ? "text-[var(--tg-accent)] font-semibold" : "text-white/70 hover:text-white"
        }`}
        aria-label={label}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-[11px]">{label}</span>
      </Link>
    );
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto h-16 max-w-3xl rounded-t-2xl border-t border-white/10 bg-black/55 backdrop-blur-md">
        {/* notch space */}
        <div className="pointer-events-none absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full" />
        <nav className="grid h-full grid-cols-6 place-items-center text-sm">
          <Tab href="/home" label="Home" icon="🏠" />
          <Tab href="/tasks" label="Tasks" icon="✅" />
          <Tab href="/calendar" label="Calendar" icon="🗓️" />
          <Tab href="/downloads" label="Downloads" icon="⬇️" />
          <Tab href="/updates" label="Updates" icon="🔔" />
          <Tab href="/profile" label="Profile" icon="👤" />
        </nav>
      </div>
    </footer>
  );
}
