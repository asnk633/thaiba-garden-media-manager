"use client";

import { useMemo } from "react";
import { useClientData } from "@/app/(shell)/ClientDataContext";

const COLOR: Record<string, string> = {
  all: "bg-emerald-500/25 text-emerald-200",
  team: "bg-blue-500/25 text-blue-200",
  branch: "bg-violet-500/25 text-violet-200",
  custom: "bg-amber-500/25 text-amber-200",
};

export default function CalendarPage() {
  const { events } = useClientData();

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [events]);

  return (
    <div className="px-4 pb-28 pt-4">
      <h1 className="text-[28px] font-bold leading-tight">Calendar</h1>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge label="All" cls={COLOR.all} />
        <Badge label="Team" cls={COLOR.team} />
        <Badge label="Branch" cls={COLOR.branch} />
        <Badge label="Custom" cls={COLOR.custom} />
      </div>

      {/* List view (simple & responsive); plug real grid later */}
      <div className="mt-4 flex flex-col gap-3">
        {sorted.map((ev) => (
          <div key={ev.id} className="rounded-xl bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{ev.title}</p>
                <p className="text-sm text-white/70">{new Date(ev.startAt).toLocaleString()}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${COLOR[ev.visibility ?? "team"]}`}>
                {ev.visibility ?? "team"}
              </span>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-6 text-center text-white/70">
            No events yet. Tap + to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`rounded-md px-2 py-1 ${cls}`}>{label}</span>;
}
