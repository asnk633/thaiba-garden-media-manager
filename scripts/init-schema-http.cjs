/**
 * Lightweight schema initializer that calls the Turso libsql pipeline endpoint
 * via HTTP. Uses TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN from .env.
 *
 * Run:
 *   node scripts/init-schema-http.cjs
 */
require('dotenv').config();
const { TURSO_CONNECTION_URL: url, TURSO_AUTH_TOKEN: token } = process.env;

if (!url || !token) {
  console.error('Missing TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN in env.');
  process.exit(2);
}

const pipelineUrl = url.replace(/\/+$/,'') + '/v2/pipeline';

const stmts = [
  // institutions (simple)
  `CREATE TABLE IF NOT EXISTS institutions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // users
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'team',
    institution_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // tasks
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    assigned_to_id INTEGER,
    created_by_id INTEGER,
    institution_id INTEGER DEFAULT 1,
    due_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // events
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_time TEXT,
    end_time TEXT,
    approval_status TEXT DEFAULT 'pending',
    created_by_id INTEGER,
    institution_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // notifications
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
];

(async () => {
  try {
    console.log('Pipeline URL:', pipelineUrl);
    // Build pipeline requests
    const requests = stmts.map(s => ({ type: 'execute', stmt: { sql: s } }));
    // Add a close request at the end
    requests.push({ type: 'close' });

    const body = JSON.stringify({ requests });

    const res = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body
    });

    const text = await res.text();
    console.log('HTTP', res.status);
    try {
      const json = JSON.parse(text);
      console.log('Response (truncated):', JSON.stringify(json, null, 2).slice(0, 2000));
    } catch (e) {
      console.log('Response text:', text.slice(0,2000));
    }

    if (!res.ok) {
      console.error('Pipeline returned non-OK status. Aborting.');
      process.exit(3);
    }

    console.log('Schema init finished. Restart your dev server (npm run dev).');
  } catch (err) {
    console.error('Error during schema init:', err);
    process.exit(4);
  }
})();
