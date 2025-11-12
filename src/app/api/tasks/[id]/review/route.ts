// src/app/api/tasks/[id]/review/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

// Accepts reviewStatus values and canonicalizes them for the DB
const ALLOWED = new Set(["pending", "approved", "rejected"]);

export async function PATCH(req: Request, context: { params: any }) {
  try {
    // Next.js may pass params as a plain object or a promise — handle both safely.
    const paramsOrPromise = context?.params ?? undefined;
    const resolvedParams =
      paramsOrPromise && typeof (paramsOrPromise as Promise<any>).then === "function"
        ? await paramsOrPromise
        : paramsOrPromise;

    const idRaw = resolvedParams?.id ?? (context as any)?.params?.id;
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const body = await req.json();
    const incoming = (body?.reviewStatus ?? "").toString().trim().toLowerCase();
    if (!ALLOWED.has(incoming)) {
      return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 });
    }
    const canonical = incoming; // already correct values: pending|approved|rejected

    // Try Drizzle update first (preferred).
    try {
      await db.update(tasks).set({ reviewStatus: canonical as any }).where(eq(tasks.id, id));
      return NextResponse.json({ ok: true });
    } catch (drizzleErr) {
      // Drizzle produced invalid SQL in some environments (empty SET) or other driver issue.
      console.warn("Drizzle update failed, falling back to raw SQL update", drizzleErr);
    }

    // Fallback: raw SQL update (use whichever API the db object exposes).
    // This tries multiple shapes so it works with different driver versions.
    try {
      // 1) drizzle/libsql driver -> db.execute({ sql, args }) pattern
      if (typeof (db as any).execute === "function") {
        await (db as any).execute({
          sql: "UPDATE tasks SET review_status = ? WHERE id = ?",
          args: [canonical, id],
        });
        return NextResponse.json({ ok: true });
      }

      // 2) common sqlite wrappers expose run/prepare
      if (typeof (db as any).run === "function") {
        await (db as any).run("UPDATE tasks SET review_status = ? WHERE id = ?", canonical, id);
        return NextResponse.json({ ok: true });
      }

      // 3) maybe 'client' property exists (libsql client)
      const maybeClient = (db as any).client ?? (db as any);
      if (maybeClient && typeof maybeClient.execute === "function") {
        // libsql client uses 'execute' and parameter name 'parameters' in some versions
        await maybeClient.execute({
          sql: "UPDATE tasks SET review_status = ? WHERE id = ?",
          parameters: [canonical, id],
        });
        return NextResponse.json({ ok: true });
      }

      // If none matched, throw so we return 500
      throw new Error("No suitable DB execute method found");
    } catch (rawErr) {
      console.error("Raw SQL fallback failed", rawErr);
      return NextResponse.json({ error: "Failed to update reviewStatus" }, { status: 500 });
    }
  } catch (err) {
    console.error("PATCH /api/tasks/[id]/review - unexpected error", err);
    return NextResponse.json({ error: "Failed to update reviewStatus" }, { status: 500 });
  }
}