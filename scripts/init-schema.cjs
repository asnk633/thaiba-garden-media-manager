// scripts/init-schema.cjs
require('dotenv').config();
const { createClient } = require('@libsql/client');

function mask(s){ if(!s) return '(empty)'; return String(s).slice(0,40) + (String(s).length>40? '…':'' );}

(async function main(){
  const url = process.env.TURSO_CONNECTION_URL || process.env.DATABASE_URL || '';
  const token = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_URL_AUTH || '';

  console.log('DB URL:', mask(url));
  console.log('Token present:', !!token);
  if(!url || !token){
    console.error('Missing TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN in .env — aborting.');
    process.exit(1);
  }

  const client = createClient({ url, auth: { token }});
  try {
    console.log('Creating tables if they do not exist...');

    // Tasks table (includes approval boolean)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        assigned_to_id INTEGER,
        created_by_id INTEGER,
        institution_id INTEGER DEFAULT 1,
        due_date TEXT,
        approval BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Events table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        start_time TEXT,
        end_time TEXT,
        approval_status TEXT DEFAULT 'pending',
        created_by_id INTEGER,
        institution_id INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Notifications table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        title TEXT,
        message TEXT,
        read BOOLEAN DEFAULT 0,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Add approval column to tasks when using SQLite versions that don't support IF NOT EXISTS for ALTER
    try {
      await client.execute(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval BOOLEAN DEFAULT 0;`);
    } catch (e) {
      // Some SQLite builds complain; ignore if column already exists
    }

    console.log('Schema creation done. Verifying table existence...');

    const resTasks = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tasks','events','notifications')");
    console.log('Found tables:', resTasks.rows?.map(r => r.name) ?? resTasks);

    console.log('All done — restart your dev server (npm run dev) and try the app.');
  } catch (err) {
    console.error('Error during schema init:');
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    if (client && typeof client.close === 'function') {
      try { await client.close(); } catch (e) {}
    }
  }
})();
