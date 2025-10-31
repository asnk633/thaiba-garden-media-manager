// src/app/tasks/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

// Note: SortableItem is a small wrapper component that calls useSortable and passes attributes.
// If you don't already have it, create one in src/components/SortableItem.tsx (simple wrapper).
import { SortableItem } from "@/components/SortableItem";

type Task = {
  id: number;
  title: string;
  description?: string;
  status: string;
  assignedTo?: number;
};

const STATUS_COLUMN_IDS = ["todo", "inprogress", "review", "done"];
const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  review: "Review",
  done: "Done",
};

const mapServerStatusToColumn = (serverStatus: string) => {
  // Map DB/API statuses to column ids
  switch (serverStatus) {
    case "in_progress":
      return "inprogress";
    case "review":
      return "review";
    case "completed":
      return "done";
    case "todo":
    default:
      return "todo";
  }
};

const mapColumnToServerStatus = (col: string) => {
  switch (col) {
    case "inprogress":
      return "in_progress";
    case "review":
      return "review";
    case "done":
      return "completed";
    default:
      return "todo";
  }
};

export default function TasksPage() {
  const [columns, setColumns] = useState<Record<string, Task[]>>({
    todo: [],
    inprogress: [],
    review: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("kanban"); // default Kanban
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // fetch tasks for the institution (adjust query if your API requires auth / query params)
        const res = await fetch("/api/tasks?institutionId=1&limit=500");
        const data: Task[] = await res.json();

        if (cancelled) return;

        const grouped: Record<string, Task[]> = {
          todo: [],
          inprogress: [],
          review: [],
          done: [],
        };

        (data || []).forEach((t) => {
          const col = mapServerStatusToColumn(t.status);
          if (!grouped[col]) grouped[col] = [];
          grouped[col].push(t);
        });

        setColumns(grouped);
      } catch (err) {
        console.error("Failed to load tasks", err);
        toast.error("Failed to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCol = active.data.current?.columnId as string | undefined;
    const overCol = over.data.current?.columnId as string | undefined;

    if (!activeCol || !overCol) return;
    const movedId = parseInt(String(active.id), 10);
    if (activeCol === overCol) return;

    const prev = JSON.parse(JSON.stringify(columns));
    const taskToMove = columns[activeCol].find((t) => t.id === movedId);
    if (!taskToMove) return;

    // optimistic update
    setColumns((cols) => {
      const c = { ...cols };
      c[activeCol] = c[activeCol].filter((t) => t.id !== movedId);
      c[overCol] = [{ ...taskToMove, status: mapColumnToServerStatus(overCol) }, ...c[overCol]];
      return c;
    });

    try {
      const newStatus = mapColumnToServerStatus(overCol);
      const response = await fetch(`/api/tasks/${movedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Server update failed");
      toast.success("Task moved");
    } catch (err) {
      console.error("Failed to update task status", err);
      toast.error("Failed to move task — reverting");
      setColumns(prev);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Tasks</h1>
        <div>Loading tasks…</div>
      </div>
    );
  }

  // --- Kanban Column renderer
  const KanbanColumn = ({ columnId }: { columnId: string }) => {
    const items = columns[columnId] || [];
    return (
      <div
        className="flex-1 min-w-[260px] bg-muted/5 rounded p-3"
        data-column-id={columnId} // <--- test relies on this
        aria-label={`column-${columnId}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{STATUS_LABELS[columnId]}</h3>
          <div className="text-xs text-muted-foreground">{items.length}</div>
        </div>

        <SortableContext items={items.map((t) => String(t.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-3" role="list">
            {items.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No tasks</div>}
            {items.map((task) => (
              <SortableItem key={task.id} id={String(task.id)} columnId={columnId}>
                <div
                  className="p-3 bg-card rounded shadow-sm cursor-grab"
                  data-draggable="true" // <--- test uses this option too
                  data-task-id={task.id}
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground ml-2">{/* priority or badge */}</div>
                  </div>
                  {task.description && <div className="text-xs text-muted-foreground mt-2 line-clamp-3">{task.description}</div>}
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="capitalize">{mapServerStatusToColumn(task.status)}</span>
                    {task.assignedTo && <span>• assigned: {task.assignedTo}</span>}
                  </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Tasks</h1>

        <div className="flex items-center gap-2">
          <button
            className={`btn ${view === "list" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            List
          </button>
          <button
            className={`btn ${view === "kanban" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("kanban")}
            aria-pressed={view === "kanban"}
            title="Kanban"
          >
            Kanban
          </button>
        </div>
      </div>

      {view === "list" && (
        <div className="space-y-3">
          {(Object.values(columns).flat() || []).length === 0 ? (
            <div className="text-muted-foreground">No tasks yet.</div>
          ) : (
            Object.values(columns)
              .flat()
              .map((t) => (
                <div key={t.id} className="p-3 bg-card rounded shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{mapServerStatusToColumn(t.status)}</div>
                  </div>
                  {t.description && <div className="text-sm text-muted-foreground mt-2">{t.description}</div>}
                </div>
              ))
          )}
        </div>
      )}

      {view === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto py-2">
            {STATUS_COLUMN_IDS.map((colId) => (
              <KanbanColumn key={colId} columnId={colId} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
