"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useRole } from "@/app/(shell)/RoleContext";

type Tab = "Mine" | "Team" | "All" | "Review";

export default function TasksPage() {
  const { tasks, deleteTask, updateTask } = useClientData();
  const { user } = useRole();

  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 220);

  const tabs: Tab[] = user.role === "admin" ? ["Mine", "Team", "All", "Review"] : ["Mine", "Team", "All"];
  const [tab, setTab] = useState<Tab>(tabs[0]);

  // Bulk selection (Review tab only)
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    let list = tasks;

    // Tab filter
    if (tab === "Mine") list = list.filter(t => (t.assignedTo ?? "").toLowerCase() === user.name.toLowerCase());
    if (tab === "Team") list = list.filter(t => t.reviewStatus !== "pending_review"); // hide guest submissions
    if (tab === "Review") list = list.filter(t => t.reviewStatus === "pending_review");

    // Search
    const term = dq.trim().toLowerCase();
    if (term) {
      list = list.filter(t =>
        (t.title?.toLowerCase().includes(term) ?? false) ||
        (t.assignedTo?.toLowerCase().includes(term) ?? false)
      );
    }
    return list;
  }, [tasks, dq, tab, user.name]);

  // Delete dialog
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const confirmDelete = async () => {
    if (!toDeleteId) return;
    const ok = await deleteTask(toDeleteId);
    if (!ok) alert("Couldn’t delete the task. Please try again.");
    setToDeleteId(null);
  };

  // Review actions
  const approve = async (id: string) => updateTask(id, { reviewStatus: "approved" });
  const reject  = async (id: string) => updateTask(id, { reviewStatus: "rejected" });
  const reopen  = async (id: string) => updateTask(id, { reviewStatus: "pending_review" });

  // Bulk helpers (Review tab)
  const approveSelected = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    for (const id of ids) await approve(id);
    setSelected({});
  };
  const rejectSelected = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    for (const id of ids) await reject(id);
    setSelected({});
  };
  const allChecked = filtered.length > 0 && filtered.every((t) => selected[t.id]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    if (!allChecked) filtered.forEach(t => (next[t.id] = true));
    setSelected(next);
  };

  // Reset selection if leaving Review tab
  const onTabChange = (t: Tab) => {
    setTab(t);
    if (t !== "Review") setSelected({});
  };

  return (
    <div className="px-4 pb-28">
      {/* Search */}
      <div className="py-3">
        <label className="flex h-12 w-full">
          <div className="flex items-center justify-center rounded-l-xl bg-[#224944] px-4 text-[#90cbc3]">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or assignee…"
            className="h-12 w-full rounded-r-xl bg-[#224944] px-4 text-white placeholder:text-[#90cbc3] focus:outline-none"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`h-9 shrink-0 rounded-full px-4 text-sm ${
              tab === t ? "bg-[#00BFA6] text-black font-semibold" : "bg-[#224944] text-white/90"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Admin Review bulk toolbar */}
      {user.role === "admin" && tab === "Review" && filtered.length > 0 && (
        <div className="sticky top-[52px] z-30 mb-3 flex items-center justify-between rounded-xl bg-[#173532] p-3 text-sm shadow-lg">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="size-4 accent-[#00BFA6]"
              />
              <span className="text-white/90">Select all</span>
            </label>
            <span className="text-white/60">
              {Object.values(selected).filter(Boolean).length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={approveSelected}
              className="rounded-md bg-emerald-500/20 px-3 py-1.5 font-medium text-emerald-300 hover:bg-emerald-500/30"
            >
              Approve selected
            </button>
            <button
              onClick={rejectSelected}
              className="rounded-md bg-red-500/20 px-3 py-1.5 font-medium text-red-300 hover:bg-red-500/30"
            >
              Reject selected
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-4">
        {filtered.map((t) => {
          const inReview = t.reviewStatus === "pending_review";
          const isRejected = t.reviewStatus === "rejected";
          const checked = !!selected[t.id];
          return (
            <div key={t.id} className="rounded-xl bg-[#224944]/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3 pr-3">
                  {user.role === "admin" && tab === "Review" && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelected((s) => ({ ...s, [t.id]: !checked }))}
                      className="mt-1 size-4 accent-[#00BFA6]"
                    />
                  )}
                  <Link href={`/tasks/${t.id}`} className="block flex-1">
                    <p className="text-white text-base font-medium">{t.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-[#90cbc3] text-sm">
                        Due: {t.dueAt ? new Date(t.dueAt).toLocaleString() : "—"}
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Priority color */}
                        <span
                          className={`material-symbols-outlined text-base ${
                            t.priority === "urgent" ? "text-red-600" :
                            t.priority === "high"   ? "text-red-400" :
                            t.priority === "medium" ? "text-yellow-300" : "text-white/40"
                          }`}
                          title={`Priority: ${t.priority ?? "medium"}`}
                        >
                          priority_high
                        </span>
                        <span className="rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                          {t.status ?? "Pending"}
                        </span>
                      </div>
                    </div>
                    {(t.assignedTo || t.reviewStatus) && (
                      <p className="mt-1 text-xs text-white/60">
                        {t.assignedTo ? `Assigned to: ${t.assignedTo}` : ""}
                        {t.assignedTo && t.reviewStatus ? " • " : ""}
                        {t.reviewStatus === "pending_review" && <span className="text-yellow-300">Pending review</span>}
                        {t.reviewStatus === "rejected" && <span className="text-red-400">Rejected</span>}
                      </p>
                    )}
                  </Link>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {user.role === "admin" && inReview && (
                    <>
                      <button
                        onClick={() => approve(t.id)}
                        className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject(t.id)}
                        className="rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {user.role === "admin" && isRejected && (
                    <button
                      onClick={() => reopen(t.id)}
                      className="rounded-md bg-amber-500/20 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/30"
                      title="Move back to review"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => setToDeleteId(t.id)}
                    className="grid size-9 place-items-center rounded-md bg白/5 bg-white/5 text-white/80 hover:bg-white/10"
                    title="Delete Task"
                    aria-label="Delete Task"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="mt-10 rounded-xl border border-white/10 bg-[#1c1c1c] p-6 text-center text-white/70">
            No tasks here.
          </div>
        )}
      </div>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!toDeleteId}
        title="Delete this task?"
        message="This will permanently remove the task."
        confirmText="Delete Task"
        onConfirm={confirmDelete}
        onCancel={() => setToDeleteId(null)}
      />
    </div>
  );
}
