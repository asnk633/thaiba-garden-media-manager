"use client";

import { useEffect } from "react";

type Role = "admin" | "team" | "guest";

export default function FABOverlay({
  open,
  role,
  onClose,
  onSelect,
}: {
  open: boolean;
  role: Role;
  onClose: () => void;
  onSelect: (action: string) => void;
}) {
  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEsc);
    return () => document.removeEventListener("keydown", closeOnEsc);
  }, [onClose]);

  if (!open) return null;

  const baseStyle =
    "flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-gray-500/10 p-4 transition-colors hover:bg-gray-500/20";

  const actions =
    role === "admin"
      ? [
          { icon: "task_alt", label: "Create Task", action: "task" },
          { icon: "calendar_month", label: "Create Event", action: "event" },
          { icon: "notifications_active", label: "Create Notification", action: "notice" },
          { icon: "bar_chart", label: "Reports", action: "report" },
        ]
      : role === "team"
      ? [
          { icon: "task_alt", label: "Create Task", action: "task" },
          { icon: "calendar_month", label: "Create Event", action: "event" },
        ]
      : [
          { icon: "task_alt", label: "Create Task", action: "task" },
          { icon: "calendar_month", label: "Create Event", action: "event" },
        ];

  return (
    <>
      {/* Blurred backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-lg transition-opacity"
      />

      {/* Overlay container */}
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end pb-8">
        <div className="flex w-full flex-col items-center gap-4 px-4">
          {/* Cards */}
          <div className="grid w-full max-w-md grid-cols-1 gap-4">
            {actions.map((a) => (
              <div
                key={a.action}
                className={baseStyle}
                onClick={() => {
                  onSelect(a.action);
                  onClose();
                }}
              >
                <span className="material-symbols-outlined text-[#00BFA6] text-2xl">{a.icon}</span>
                <h2 className="text-base font-bold leading-tight text-white">{a.label}</h2>
              </div>
            ))}
          </div>

          {/* Close FAB */}
          <div className="flex w-full justify-center pt-8">
            <button
              onClick={onClose}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00BFA6] text-black shadow-lg hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl font-bold">close</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
