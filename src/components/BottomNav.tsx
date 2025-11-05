// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FAB from "@/components/FAB";

export default function BottomNav({ isAdmin = false, canCreateEvent = false }: { isAdmin?: boolean; canCreateEvent?: boolean }) {
  const pathname = usePathname();

  const Tab = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center gap-1 py-1 w-full ${active ? "text-[var(--tg-accent)] font-semibold" : "text-white/70 hover:text-white"}`}
        aria-label={label}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-[11px]">{label}</span>
      </Link>
    );
  };

  const tabs: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: "/home", label: "Home", icon: "🏠" },
    { href: "/tasks", label: "Tasks", icon: "✅" },
    { href: "/calendar", label: "Calendar", icon: "🗓️" },
    { href: "/downloads", label: "Downloads", icon: "⬇️" },
    { href: "/updates", label: "Updates", icon: "🔔" },
  ];

  if (isAdmin) tabs.push({ href: "/reports", label: "Reports", icon: "📊" });
  tabs.push({ href: "/profile", label: "Profile", icon: "👤" });

  return (
    <>
      <style jsx>{`
        :root { --bottom-nav-height: 22px; } /* maintained invariant */
      `}</style>

      <footer className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto h-16 max-w-4xl rounded-t-2xl border-t border-white/10 bg-black/55 backdrop-blur-md relative">
          {/* Spacer for centered FAB. Use exact size matching FAB (w-16 h-16).
              Note: we keep the spacer so the nav top has the notch / space for FAB.
              The real FAB renders above via absolute placement inside FAB itself. */}
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full" />

          {/* Mount the single FAB above the spacer.
              Keep wrapper pointer-events-none so the FAB component decides interactivity. */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
            <FAB canCreateEvent={canCreateEvent} />
          </div>

          {/* nav grid — columns match number of tabs */}
          <nav className="grid h-full place-items-center text-sm" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
            {tabs.map((t) => (
              <div key={t.href} className="w-full h-full flex items-center justify-center">
                <Tab href={t.href} label={t.label} icon={t.icon} />
              </div>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
