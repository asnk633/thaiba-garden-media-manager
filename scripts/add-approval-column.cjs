// scripts/add-approval-column.cjs
require('dotenv').config();

function mask(s){
  if (!s) return '(empty)';
  const str = String(s);
  if (str.length <= 8) return str.replace(/./g, '*');
  return str.slice(0,4) + '…' + str.slice(-3);
}

// Use @libsql/client API
const { createClient } = require('@libsql/client');

(async function main(){
  const url = process.env.TURSO_CONNECTION_URL || process.env.DATABASE_URL || '';
  const token = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_URL_AUTH || '';

  console.log("ENV CHECK:");
  console.log("  TURSO_CONNECTION_URL present:", !!process.env.TURSO_CONNECTION_URL);
  console.log("  DATABASE_URL present:", !!process.env.DATABASE_URL);
  console.log("  TURSO_AUTH_TOKEN present:", !!process.env.TURSO_AUTH_TOKEN);
  console.log("  url:", mask(url), " (type:", typeof url + ")");
  console.log("  token:", mask(token), " (type:", typeof token + ")");

  if (!url || !token) {
    console.error("Missing url or token — aborting.");
    process.exit(1);
  }

  let client;
  try {
    client = createClient({
      url,
      auth: { token }
    });

    // quick smoke test
    const test = await client.execute("SELECT 1 AS ok");
    console.log("Test query OK — result rows:", test.rows?.length ?? '(no rows)');
    
    // example: add a column (uncomment and adjust table/column names)
    // await client.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval BOOLEAN DEFAULT FALSE");
    // console.log("Added/checked approval column.");

  } catch (err) {
    console.error("Failed creating client / running query. Error:");
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    // close if available
    if (client && typeof client.close === 'function') {
      try { await client.close(); } catch (e) { /* ignore */ }
    }
  }
})();
