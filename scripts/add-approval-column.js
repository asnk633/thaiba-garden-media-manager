// scripts/add-approval-column.js
import dotenv from "dotenv";
dotenv.config();

import { createClient } from "libsql"; // npm package 'libsql'

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN || "";

  if (!url) {
    console.error("No TURSO_CONNECTION_URL or DATABASE_URL found in env.");
    process.exit(1);
  }

  const client = createClient({ url, authToken: token });

  try {
    console.log("Running ALTER TABLE to add approval_status...");
    await client.execute(
      `ALTER TABLE events ADD COLUMN approval_status TEXT DEFAULT 'approved';`
    );
    console.log("Column added (or already exists).");
  } catch (err) {
    console.error("ALTER TABLE failed:", err?.message || err);
  } finally {
    try { await client.end?.(); } catch {}
  }
}

main();
