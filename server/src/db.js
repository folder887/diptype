const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'diptype.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    name          TEXT,
    password_hash TEXT NOT NULL,
    free_used     INTEGER NOT NULL DEFAULT 0,
    plan          TEXT NOT NULL DEFAULT 'free',       -- free | pro
    plan_expires  INTEGER,                            -- unix ms
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS generations (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    kind        TEXT NOT NULL,                         -- diploma | presentation | website | speech
    prompt      TEXT,
    title       TEXT,
    status      TEXT NOT NULL DEFAULT 'done',          -- pending | done | error
    files_json  TEXT,                                  -- [{path, content}]
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    plan         TEXT NOT NULL,                        -- monthly_usd | monthly_rub | yearly_rub
    amount       REAL NOT NULL,
    currency     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',      -- pending | succeeded | canceled
    provider_id  TEXT,
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
