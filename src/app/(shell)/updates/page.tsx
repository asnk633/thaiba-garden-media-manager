"use client";

import Link from "next/link";
import { useClientData } from "@/app/(shell)/ClientDataContext";

export default function UpdatesPage() {
  const { notifications } = useClientData();

  return (
    <div className="px-4 pb-28">
      <div className="mb-4 pt-4">
        <label className="flex h-12 w-full">
          <div className="grid h-12 w-12 place-items-center rounded-l-lg bg-white/5">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            placeholder="Search notifications"
            className="h-12 w-full rounded-r-lg bg-white/5 px-4 text-white/90 placeholder:text-gray-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3">
        {["All", "Unread", "Mentions", "System"].map((c, i) => (
          <span
            key={c}
            className={`h-10 shrink-0 rounded-lg px-5 grid place-items-center text-sm ${
              i === 0 ? "bg-[#00BFA6]/20 text-[#00BFA6] font-bold" : "bg-white/5 text-white/80"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {notifications.map((n) => (
          <Link
            href={`/updates/${n.id}`}
            key={n.id}
            className="flex items-start gap-4 rounded-lg bg-white/5 p-4 shadow-lg shadow-black/20"
          >
            <div className="relative">
              <div className="grid size-12 place-items-center rounded-full bg-[#00BFA6]/20 text-white">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              {!n.read && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#1E1E1E] bg-[#00BFA6]" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">{n.title}</p>
              <p className="text-sm text-gray-400 line-clamp-2">{n.body}</p>
            </div>
            <p className="shrink-0 text-xs text-gray-500">{n.time ?? ""}</p>
          </Link>
        ))}

        {notifications.length === 0 && (
          <div className="mt-10 rounded-xl border border-white/10 bg-[#1c1c1c] p-6 text-center text-white/70">
            No updates yet. Admin can create one from +.
          </div>
        )}
      </div>
    </div>
  );
}
