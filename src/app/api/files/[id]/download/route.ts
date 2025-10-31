// src/app/api/files/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid file id" }, { status: 400 });

    const [fileRecord] = await db.select().from(files).where(eq(files.id, id)).limit(1);

    if (!fileRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If file stored as base64 in fileUrl, return that directly
    if (fileRecord.fileUrl) {
      return NextResponse.json({ downloadUrl: fileRecord.fileUrl }, { status: 200 });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

    // Create a signed URL for 1 hour
    const { data, error } = await supabase.storage.from("files").createSignedUrl(fileRecord.storagePath, 60 * 60);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: "Failed to create signed url" }, { status: 500 });
    }

    return NextResponse.json({ downloadUrl: data.signedUrl }, { status: 200 });
  } catch (err) {
    console.error("download error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
