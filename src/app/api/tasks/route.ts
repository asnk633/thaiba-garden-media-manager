import { NextRequest, NextResponse } from "next/server";
import { db, makeId, nowISO } from "../_lib/store"; // assumes your in-memory store exports these
import type { Task } from "../_lib/store";

/**
 * GET /api/tasks?institutionId=1&limit=500
 * Simple list with optional institution filter + limit.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId") ?? "1";
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 2000);

    const all = Array.from(db.tasks.values()).filter(
      (t) => (t.institutionId ?? "1") === institutionId
    );
    const data = all.slice(0, limit);

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Body: { title, description?, status?, priority?, dueAt?, assignedTo?, assignedBy?, reviewStatus?, institutionId? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.title || String(body.title).trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = makeId("tsk");
    const now = nowISO();

    // NEW: reviewStatus passthrough with default "approved"
    const row: Task = {
      id,
      institutionId: body.institutionId ?? "1",
      title: String(body.title),
      description: body.description ?? "",
      status: body.status ?? "pending",
      priority: body.priority ?? "medium",
      dueAt: body.dueAt ?? null,
      assignedTo: body.assignedTo ?? null,
      assignedBy: body.assignedBy ?? null,
      reviewStatus: body.reviewStatus ?? "approved", // NEW default
      createdAt: now,
      updatedAt: now,
    } as Task;

    db.tasks.set(id, row);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
