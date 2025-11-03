"use client";

import { useEffect, useMemo, useState } from "react";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import { uiFromApiStatus, apiFromUiStatus } from "@/app/(shell)/utils/uiMaps";
import { useToast } from "@/components/ToastProvider";
import PeoplePicker from "@/components/PeoplePicker"; // ADDED IMPORT

type ApiTask = {
  id: string;
  title: string;
  description?: string;
  status?: "pending" | "working" | "completed" | "on_hold";
  priority?: "low" | "medium" | "high" | "urgent";
  dueAt?: string | null;
  assignedTo?: string | null;
  assignedBy?: string | null;
};

const prettyDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");
const pad = (n: number) => String(n).padStart(2, "0");
const isoToLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localInputToIso = (val: string) => (val ? new Date(val).toISOString() : null);

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { updateTask } = useClientData();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<ApiTask | null>(null);

  // saving flags
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingDue, setSavingDue] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);

  // title edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // description edit
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");

  // due edit
  const [editingDue, setEditingDue] = useState(false);
  const [dueInput, setDueInput] = useState<string>("");

  // Fetch authoritative task
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/tasks/${id}`);
        const json = await res.json();
        if (active) {
          setTask(json?.data ?? null);
          setTitleInput(json?.data?.title ?? "");
          setDescInput(json?.data?.description ?? "");
          setDueInput(isoToLocalInput(json?.data?.dueAt));
        }
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id]);

  const uiStatus = useMemo(() => uiFromApiStatus(task?.status), [task?.status]);

  // Save title
  const saveTitle = async () => {
    if (!task) return;
    const next = titleInput.trim();
    if (!next || next === task.title) { setEditingTitle(false); setTitleInput(task.title); return; }
    setSavingTitle(true);
    const ok = await updateTask(task.id, { title: next });
    if (!ok) { setTitleInput(task.title); toast.show("Couldn’t update title", "error"); }
    else { setTask({ ...task, title: next }); setEditingTitle(false); toast.show("Title updated", "success"); }
    setSavingTitle(false);
  };

  // Save description (Ctrl/Cmd+Enter also saves)
  const saveDesc = async () => {
    if (!task) return;
    const next = descInput.trim();
    if (next === (task.description ?? "")) { setEditingDesc(false); return; }
    setSavingDesc(true);
    // We use updateTask with a title no-op if needed; here we send only description via PATCH outside store:
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: next }),
      });
      if (!res.ok) throw new Error("bad");
      const json = await res.json().catch(() => null);
      const server = json?.data as ApiTask | undefined;
      setTask(server ?? { ...task, description: next });
      setEditingDesc(false);
      toast.show("Description updated", "success");
    } catch {
      setDescInput(task.description ?? "");
      toast.show("Couldn’t update description", "error");
    } finally {
      setSavingDesc(false);
    }
  };

  // Status change
  const handleStatus = async (nextUi: "Pending" | "Working On" | "On Hold" | "Completed") => {
    if (!task) return;
    setSavingStatus(true);
    const ok = await updateTask(task.id, { status: nextUi });
    if (!ok) toast.show("Couldn’t update status", "error");
    else { setTask({ ...task, status: (apiFromUiStatus(nextUi) as any) }); toast.show("Status updated", "success"); }
    setSavingStatus(false);
  };

  // Priority change
  const handlePriority = async (next: ApiTask["priority"]) => {
    if (!task || next === task.priority) return;
    setSavingPriority(true);
    const ok = await updateTask(task.id, { priority: next as any });
    if (!ok) toast.show("Couldn’t update priority", "error");
    else { setTask({ ...task, priority: next }); toast.show("Priority updated", "success"); }
    setSavingPriority(false);
  };

  // Due date change
  const saveDue = async () => {
    if (!task) return;
    setSavingDue(true);
    const iso = localInputToIso(dueInput);
    const ok = await updateTask(task.id, { dueAt: iso ?? null });
    if (!ok) toast.show("Couldn’t update due date", "error");
    else { setTask({ ...task, dueAt: iso }); setEditingDue(false); toast.show("Due date updated", "success"); }
    setSavingDue(false);
  };
  const clearDue = async () => {
    if (!task) return;
    setSavingDue(true);
    const ok = await updateTask(task.id, { dueAt: null });
    if (!ok) toast.show("Couldn’t clear due date", "error");
    else { setTask({ ...task, dueAt: null }); setDueInput(""); setEditingDue(false); toast.show("Due date cleared", "success"); }
    setSavingDue(false);
  };

  if (loading) return <div className="px-4 pb-28 pt-6"><div className="rounded-xl bg-[#1f1f1f] p-4">Loading…</div></div>;
  if (!task) return <div className="px-4 pb-28 pt-6"><div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-5"><h2 className="text-lg font-bold">Task not found</h2><p className="text-white/70">It may have been deleted or you don’t have access.</p></div></div>;

  return (
    <div className="px-4 pb-28 pt-6">
      {/* Title (inline) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        {!editingTitle ? (
          <>
            <h1 className="text-[28px] font-bold leading-tight">{task.title}</h1>
            <div className="flex gap-2">
              <button onClick={() => setEditingTitle(true)} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">Edit Title</button>
            </div>
          </>
        ) : (
          <div className="w-full sm:max-w-xl">
            <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} className="h-12 w-full rounded-md bg-[#1c1c1c] px-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA6]" />
            <div className="mt-2 flex gap-2">
              <button onClick={saveTitle} disabled={savingTitle || !titleInput.trim()} className="rounded-md bg-[#00BFA6] px-3 py-1.5 text-sm font-bold text-black disabled:opacity-60">{savingTitle ? "Saving…" : "Save"}</button>
              <button onClick={() => { setEditingTitle(false); setTitleInput(task.title); }} className="rounded-md bg-white/10 px-3 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Description (inline, textarea, Ctrl/Cmd+Enter saves) */}
      <div className="mt-3 rounded-xl bg-[#1f1f1f] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-white/90">Description</p>
          {!editingDesc ? (
            <button onClick={() => setEditingDesc(true)} className="text-xs text-[#00BFA6] hover:underline">Edit</button>
          ) : (
            <button onClick={() => { setEditingDesc(false); setDescInput(task.description ?? ""); }} className="text-xs text-white/70 hover:underline">Cancel</button>
          )}
        </div>

        {!editingDesc ? (
          <p className="whitespace-pre-wrap text-white/80">{task.description?.trim() ? task.description : "—"}</p>
        ) : (
          <div className="space-y-2">
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); saveDesc(); } }}
              className="min-h-32 w-full resize-y rounded-md bg-[#242424] p-3 focus:outline-none focus:ring-2 focus:ring-[#00BFA6]"
            />
            <div className="flex gap-2">
              <button onClick={saveDesc} disabled={savingDesc} className="rounded-md bg-[#00BFA6] px-3 py-1.5 text-sm font-bold text-black">
                {savingDesc ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditingDesc(false); setDescInput(task.description ?? ""); }} className="rounded-md bg-white/10 px-3 py-1.5 text-sm">
                Cancel
              </button>
            </div>
            <p className="text-xs text-white/50">Tip: Press <kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd> to save.</p>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Due — inline */}
        <div className="rounded-lg bg-[#262626] p-3">
          <div className="mb-2 flex items-center justify-between">
            <Label icon="calendar_month" text="Due" />
            {!editingDue ? (
              <button onClick={() => setEditingDue(true)} className="text-xs text-[#00BFA6] hover:underline">Edit</button>
            ) : (
              <button onClick={() => { setEditingDue(false); setDueInput(isoToLocalInput(task.dueAt)); }} className="text-xs text-white/70 hover:underline">Cancel</button>
            )}
          </div>
          {!editingDue ? (
            <p className="text-white/70">{prettyDate(task.dueAt)}</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="datetime-local" value={dueInput} onChange={(e) => setDueInput(e.target.value)} className="h-10 rounded-md bg-[#1c1c1c] px-3 [color-scheme:dark]" />
              <div className="flex gap-2">
                <button onClick={saveDue} disabled={savingDue} className="rounded-md bg-[#00BFA6] px-3 py-2 text-sm font-bold text-black">{savingDue ? "Saving…" : "Save"}</button>
                {task.dueAt && <button onClick={clearDue} disabled={savingDue} className="rounded-md bg-white/10 px-3 py-2 text-sm">Clear</button>}
              </div>
            </div>
          )}
        </div>

        <Meta label="Assigned By" value={task.assignedBy ?? "—"} icon="badge" />
        
        {/* Assigned To — inline picker */}
        <div className="rounded-lg bg-[#262626] p-3">
          <div className="mb-2 flex items-center justify-between">
            <Label icon="group" text="Assigned To" />
          </div>
          <PeopleAssign task={task} setTask={setTask} />
        </div>
        
        {/* Priority — inline pills */}
        <div className="rounded-lg bg-[#262626] p-3">
          <div className="mb-2 flex items-center justify-between"><Label icon="priority_high" text="Priority" /></div>
          <div className="flex flex-wrap gap-2">
            {(["low", "medium", "high", "urgent"] as const).map((p) => (
              <button
                key={p}
                disabled={savingPriority}
                onClick={() => handlePriority(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  task.priority === p
                    ? p === "urgent" ? "bg-red-600 text-white"
                    : p === "high"   ? "bg-red-500/80 text-white"
                    : p === "medium" ? "bg-yellow-500/70 text-black"
                    : "bg-white/90 text-black"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status pills */}
      <section className="mt-6 rounded-xl bg-[#1f1f1f] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-white/80">Status:</p>
          <div className="flex flex-wrap gap-2">
            {(["Pending", "Working On", "On Hold", "Completed"] as const).map((opt) => (
              <button
                key={opt}
                disabled={savingStatus}
                onClick={() => handleStatus(opt)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  uiStatus === opt ? "bg-[#00BFA6] text-black" : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => handleStatus("Completed")} disabled={savingStatus} className="grid h-12 place-items-center rounded-xl bg-[#00BFA6] font-bold text-black">
          {savingStatus && uiStatus !== "Completed" ? "Saving…" : "Mark Complete"}
        </button>
        <a href="/tasks" className="grid h-12 place-items-center rounded-xl bg-white/10">Back to Tasks</a>
      </div>

      <p className="mt-8 text-xs text-white/50">Task ID: {id}</p>
    </div>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-lg bg-[#262626] p-3">
      <Label icon={icon} text={label} />
      <p className="shrink-0 text-white/70">{value}</p>
    </div>
  );
}
function Label({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-lg bg-white/5">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-white/90">{text}</p>
    </div>
  );
}

// ADDED HELPER COMPONENT
function PeopleAssign({ task, setTask }: { task: any; setTask: (t: any) => void }) {
  const { updateTask } = useClientData();
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="text-white/80">
        {task.assignedTo ? <span>{task.assignedTo}</span> : <span className="text-white/50">Unassigned</span>}
      </div>
      <PeoplePicker
        value={null} // We’re storing user id on server; here we optimistically show name text instead.
        onSelect={async (id, name) => {
          setSaving(true);
          const ok = await updateTask(task.id, { assignedTo: id ?? null });
          if (ok) setTask({ ...task, assignedTo: id ? name ?? id : null });
          setSaving(false);
        }}
        buttonClass={`rounded-md px-3 py-1.5 text-sm ${saving ? "bg-white/10" : "bg-white/10 hover:bg-white/15"}`}
      />
    </div>
  );
}