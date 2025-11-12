"use client";
import React, { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  reviewStatus?: string | null;
  createdAt?: string;
};

// Minimal in-file toast so UI gives immediate feedback even if project toast isn't available.
function useToast() {
  const [messages, setMessages] = useState<
    { id: number; text: string; type?: "info" | "success" | "error" }[]
  >([]);
  useEffect(() => {
    if (messages.length === 0) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }, 3500)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);
  const push = (text: string, type: "info" | "success" | "error" = "info") =>
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text, type }]);
  const ToastUI = () => (
    <div aria-live="polite" style={{ position: "fixed", top: 12, right: 12, zIndex: 9999 }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            marginBottom: 8,
            padding: "10px 14px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            background: m.type === "error" ? "#ffdddd" : m.type === "success" ? "#ddffdf" : "#ffffff",
            color: "#111",
            minWidth: 200,
            fontSize: 13,
          }}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
  return { push, ToastUI };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const { push, ToastUI } = useToast();
  const [filter, setFilter] = useState<"all" | "mine" | "team" | "review">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // adjust query params as your app expects
        const q = new URLSearchParams({ institutionId: "1", limit: "500" });
        const res = await fetch(`/api/tasks?${q.toString()}`);
        if (!mounted) return;
        if (!res.ok) {
          const txt = await res.text();
          console.error("/api/tasks failed", res.status, txt);
          push("Failed to load tasks", "error");
          setTasks([]);
        } else {
          const json = await res.json();
          // API returns { data: Task[] }
          setTasks(Array.isArray(json?.data) ? json.data : []);
        }
      } catch (err) {
        console.error("Failed fetching tasks", err);
        push("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function visibleTasks() {
    const term = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter === "mine") {
        // If you have user context, refine this. For now show all.
      } else if (filter === "team") {
        // placeholder
      } else if (filter === "review") {
        // show only tasks that have reviewStatus maybe pending/...
        // but keep flexible: show all for now unless you want strict filtering
      }
      if (!term) return true;
      return (
        (t.title || "").toLowerCase().includes(term) ||
        (t.description || "").toLowerCase().includes(term)
      );
    });
  }

  async function saveReview(taskId: number, nextValue: string) {
    // value must be exactly one of backend values: "pending", "approved", "rejected"
    const canonical = String(nextValue).toLowerCase();
    if (!["pending", "approved", "rejected"].includes(canonical)) {
      push("Invalid review status", "error");
      return;
    }
    setSaving((s) => ({ ...s, [taskId]: true }));
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: canonical }),
      });
      if (!res.ok) {
        console.error("PATCH failed", res.status);
        push("Failed to update reviewStatus", "error");
        return;
      }
      // success: update local copy
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, reviewStatus: canonical } : t)));
      push("Review status updated", "success");
    } catch (err) {
      console.error("Patch error", err);
      push("Failed to update reviewStatus", "error");
    } finally {
      setSaving((s) => ({ ...s, [taskId]: false }));
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <ToastUI />
      <h1 style={{ fontSize: 28, marginBottom: 18 }}>Task Review Dashboard</h1>

      <div style={{ maxWidth: 920, marginBottom: 12 }}>
        <input
          aria-label="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or assignee..."
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            color: "white",
            marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["mine", "team", "all", "review"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "none",
                background: filter === v ? "#0f8" : "rgba(255,255,255,0.04)",
                color: filter === v ? "#003" : "#ddd",
                cursor: "pointer",
              }}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 920 }}>
        {loading && <div>Loading tasks…</div>}
        {!loading && visibleTasks().length === 0 && <div style={{ opacity: 0.7 }}>No tasks here.</div>}

        {visibleTasks().map((task) => (
          <div
            key={task.id}
            style={{
              borderRadius: 8,
              padding: 18,
              background: "rgba(255,255,255,0.02)",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: "75%" }}>
              <h3 style={{ margin: 0, color: "#fff" }}>{task.title}</h3>
              {task.description ? <div style={{ color: "#bbb" }}>{task.description}</div> : null}
              <div style={{ marginTop: 10, fontSize: 13, color: "#cfcfcf" }}>
                Status: <span style={{ color: "#88c" }}>{task.status ?? "todo"}</span> &nbsp; Priority:{" "}
                <span style={{ color: "#f7b500" }}>{task.priority ?? "medium"}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                aria-label={`Review status for ${task.title}`}
                value={task.reviewStatus ?? "pending"}
                onChange={(e) => {
                  // optimistic update locally
                  const val = e.target.value.toLowerCase();
                  setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, reviewStatus: val } : t)));
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  minWidth: 140,
                  background: "#fff",
                }}
              >
                {/* exact values backend expects */}
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={() => saveReview(task.id, task.reviewStatus ?? "pending")}
                disabled={Boolean(saving[task.id])}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: saving[task.id] ? "#888" : "#1b7f1b",
                  color: "#fff",
                }}
              >
                {saving[task.id] ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}