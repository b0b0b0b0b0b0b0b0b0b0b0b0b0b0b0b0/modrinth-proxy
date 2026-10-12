import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'site.db')

const MIGRATIONS = [
  `
  CREATE TABLE meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    username_lower TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  ) WITHOUT ROWID;
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    project_type TEXT NOT NULL,
    title TEXT NOT NULL,
    icon_url TEXT,
    updated_at INTEGER NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, project_id)
  ) WITHOUT ROWID;

  CREATE TABLE download_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX download_history_user ON download_history(user_id, created_at);
  `,
  `
  ALTER TABLE favorites ADD COLUMN seen_at INTEGER NOT NULL DEFAULT 0;
  UPDATE favorites SET seen_at = created_at;
  `,
  `
  DROP TABLE IF EXISTS reactions;
  `,
  `
  CREATE TABLE update_dismissals (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    PRIMARY KEY (user_id, project_id)
  ) WITHOUT ROWID;
  `,
  `
  DROP TABLE update_dismissals;
  CREATE TABLE update_dismissals (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    variant TEXT NOT NULL DEFAULT '',
    version_id TEXT NOT NULL,
    PRIMARY KEY (user_id, project_id, variant)
  ) WITHOUT ROWID;

  CREATE TABLE installs (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    variant TEXT NOT NULL,
    version_id TEXT NOT NULL,
    version_number TEXT NOT NULL,
    version_type TEXT NOT NULL,
    loaders TEXT NOT NULL,
    game_version TEXT NOT NULL,
    published_at INTEGER NOT NULL,
    downloaded_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, project_id, variant)
  ) WITHOUT ROWID;
  `,
  `
  CREATE TABLE signup_log (
    id INTEGER PRIMARY KEY,
    ip_key TEXT NOT NULL,
    subnet_key TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX signup_log_ip ON signup_log(ip_key, created_at);
  CREATE INDEX signup_log_subnet ON signup_log(subnet_key, created_at);
  `,
  `
  DROP TABLE IF EXISTS trend_last;
  DROP TABLE IF EXISTS trend_points;
  DELETE FROM meta WHERE key LIKE 'trend_%';
  `,
]

function migrate(db) {
  const current = db.pragma('user_version', { simple: true })
  for (let version = current; version < MIGRATIONS.length; version += 1) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version])
      db.pragma(`user_version = ${version + 1}`)
    })()
  }
}

export function getDb() {
  if (!globalThis.__siteDb) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
    const db = new Database(DB_FILE)
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 5000')
    globalThis.__siteDb = db
  }
  if (globalThis.__siteDbVersion !== MIGRATIONS.length) {
    migrate(globalThis.__siteDb)
    globalThis.__siteDbVersion = MIGRATIONS.length
  }
  return globalThis.__siteDb
}

export function getMeta(key) {
  return getDb().prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null
}

export function setMeta(key, value) {
  getDb()
    .prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(value))
}
