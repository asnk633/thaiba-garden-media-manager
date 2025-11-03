"use client";
import { useState } from "react";
import { Plus, CalendarPlus, ClipboardPlus, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

export default function FloatingActionButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth?.() ?? { user: null };

  const canBroadcast =
    user?.role === "admin" || user?.permissions?.includes?.("broadcast_notification");

  const actions = [
    {
      key: "task",
      label: "New Task",
      icon: <ClipboardPlus size={18} />,
      go: "/tasks/new",
    },
    {
      key: "event",
      label: "New Event",
      icon: <CalendarPlus size={18} />,
      go: "/calendar/new",
    },
    ...(canBroadcast
      ? [
          {
            key: "broadcast",
            label: "Broadcast Notification",
            icon: <Megaphone size={18} />,
            go: "/notifications/new",
          },
        ]
      : []),
  ];

  return (
    <>
      {/* overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[59] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB: absolute, centered in the shared anchor (AppChrome) */}
      <button
        aria-label="Create"
        className={clsx(
          "absolute left-1/2 -translate-x-1/2",
          "rounded-full h-14 w-14 bg-emerald-600 text-white shadow-lg shadow-emerald-900/30",
          "active:scale-95 transition z-[60]",
          className
        )}
        style={{
          bottom: "calc(var(--tg-nav-height) + 10px)",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className={`mx-auto transition ${open ? "rotate-45" : ""}`} />
      </button>

      {/* Speed-dial menu */}
      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center"
          style={{ bottom: "calc(var(--tg-nav-height) + 72px)" }}
        >
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                setOpen(false);
                router.push(a.go);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white shadow hover:opacity-95"
            >
              {a.icon}
              <span className="text-sm">{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
