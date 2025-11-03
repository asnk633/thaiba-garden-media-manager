import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/store"; // path: /api/tasks/[id]/route.ts -> /api/_lib/store
import type { Task } from "../../_lib/store";

/**
 * GET /api/tasks/:id
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = db.tasks.get(params.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: row }, { status: 200 });
}

/**
 * PATCH /api/tasks/:id
 * Allows updating title, description, status, priority, dueAt, assignedTo, assignedBy, reviewStatus.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = db.tasks.get(params.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const delta = await req.json();

    // NEW: include reviewStatus passthrough, keep title explicit (so empty string doesn't clobber)
    const updated: Task = {
      ...row,
      ...delta,
      title: delta.title ?? row.title,
      reviewStatus: delta.reviewStatus ?? row.reviewStatus, // NEW
      updatedAt: new Date().toISOString(),
    };

    db.tasks.set(row.id, updated);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/:id
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const existed = db.tasks.has(params.id);
  db.tasks.delete(params.id);
  return new NextResponse(null, { status: existed ? 204 : 204 });
}
