import { NextRequest } from "next/server";
import { ok, notFound, bad, noContent } from "../../_lib/http";
import { db, Notification } from "../../_lib/store";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = db.notifications.get(params.id);
  if (!row) return notFound("Notification not found");
  return ok(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const row = db.notifications.get(params.id);
  if (!row) return notFound("Notification not found");

  const delta = await req.json().catch(() => null);
  if (!delta) return bad("Invalid JSON");

  const updated: Notification = { ...row, ...delta, updatedAt: new Date().toISOString() };
  db.notifications.set(params.id, updated);
  return ok(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const existed = db.notifications.delete(params.id);
  if (!existed) return notFound("Notification not found");
  return noContent();
}
