import { NextRequest } from "next/server";
import { ok, notFound, bad, noContent } from "../../_lib/http";
import { db, Event } from "../../_lib/store";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = db.events.get(params.id);
  if (!row) return notFound("Event not found");
  return ok(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const row = db.events.get(params.id);
  if (!row) return notFound("Event not found");

  const delta = await req.json().catch(() => null);
  if (!delta) return bad("Invalid JSON");

  const updated: Event = { ...row, ...delta, updatedAt: new Date().toISOString() };
  db.events.set(params.id, updated);
  return ok(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const existed = db.events.delete(params.id);
  if (!existed) return notFound("Event not found");
  return noContent();
}
