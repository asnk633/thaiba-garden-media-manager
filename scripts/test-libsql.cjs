// scripts/test-libsql.cjs
require('dotenv').config();

function mask(s){
  if (!s) return '(empty)';
  s = String(s);
  if (s.length <= 8) return s.replace(/./g, '*');
  return s.slice(0,4) + '…' + s.slice(-3);
}

let createClient;
try {
  ({ createClient } = require('@libsql/client'));
} catch (e) {
  console.error('Require @libsql/client failed:', e && e.stack ? e.stack : e);
  process.exit(2);
}

const url = process.env.TURSO_CONNECTION_URL || process.env.DATABASE_URL || '';
const token = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_URL_AUTH || '';

(async () => {
  console.log('ENV: TURSO_CONNECTION_URL present?', !!process.env.TURSO_CONNECTION_URL);
  console.log('ENV: TURSO_AUTH_TOKEN present?', !!process.env.TURSO_AUTH_TOKEN);
  console.log('url:', mask(url));
  console.log('token:', mask(token));

  if (!url || !token) {
    console.error('Missing TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN — aborting.');
    process.exit(1);
  }

  let client;
  try {
    client = createClient({ url, auth: { token }});
    const r = await client.execute('SELECT 1 AS ok');
    console.log('SELECT 1 result rows:', r.rows ?? r);
    // When ready, uncomment and edit the next line to actually alter your table:
    // await client.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval BOOLEAN DEFAULT FALSE");
    // console.log('Checked/added approval column.');
  } catch (err) {
    console.error('Client/query error:');
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 3;
  } finally {
    if (client && typeof client.close === 'function') {
      try { await client.close(); } catch (e) { /* ignore */ }
    }
  }
})();
