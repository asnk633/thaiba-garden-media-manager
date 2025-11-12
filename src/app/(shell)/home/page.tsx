// src/app/(shell)/home/page.tsx
"use client";

export default function Home() {
  return (
    <div className="px-4">
      <h2 className="mb-3 mt-2 text-[28px] font-bold leading-tight tracking-tight">Good Morning, Alex</h2>

      <div className="flex flex-col gap-4">
        <Card
          kicker="DUE TODAY"
          title="Upcoming Tasks"
          lines={["You have 5 tasks due today.", "3 tasks are overdue."]}
          cta={{ label: "View All", href: "/tasks" }}
        />
        <Card
          kicker="SCHEDULE"
          title="Today's Events"
          lines={["2 events scheduled for today.", "Next event starts in 1 hour."]}
          cta={{ label: "View Calendar", href: "/calendar" }}
        />
        <Card
          kicker="LATEST ALERTS"
          title="Recent Notifications"
          lines={["You have 3 unread notifications.", "New comment on 'Project Alpha'."]}
          cta={{ label: "View", href: "/updates" }}
        />
      </div>
    </div>
  );
}

function Card({
  kicker, title, lines, cta,
}: { kicker: string; title: string; lines: string[]; cta: { label: string; href: string } }) {
  return (
    <section className="rounded-lg bg-[#2a2a2a] p-4 shadow-lg">
      <p className="text-[#B3B3B3] text-sm tracking-widest">{kicker}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-bold">{title}</p>
          {lines.map((t, i) => <p className="text-[#B3B3B3]" key={i}>{t}</p>)}
        </div>
        <a href={cta.href} className="grid h-10 place-items-center rounded-lg bg-[var(--tg-accent)] px-4 text-sm font-bold text-black">
          {cta.label}
        </a>
      </div>
    </section>
  );
}
