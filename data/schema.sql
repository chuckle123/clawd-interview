-- Job Search OS — SQLite Schema
-- Usage: mkdir -p data && sqlite3 data/job-search.db < data/schema.sql

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website TEXT,
  readme_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  stage TEXT NOT NULL DEFAULT 'researching',
  tech_stack TEXT,
  applied_date TEXT,
  application_type TEXT,
  application_content TEXT,
  application_file_path TEXT,
  notes TEXT,
  sourced_by_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL DEFAULT (date('now')),
  from_value TEXT,
  to_value TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  relationship TEXT,
  notes TEXT,
  type TEXT,
  agency TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interview_date TEXT,
  interview_time TEXT,
  type TEXT,
  round_number INTEGER,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  went_well TEXT,
  could_improve TEXT,
  signals TEXT,
  follow_up_actions TEXT,
  notes_path TEXT,
  calendar_event_id TEXT,
  debriefed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interview_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT
);

CREATE TABLE IF NOT EXISTS action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  job_event_id INTEGER REFERENCES job_events(id) ON DELETE SET NULL,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  due_date TEXT,
  priority INTEGER,
  snooze_until TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE SET NULL,
  name TEXT,
  file_path TEXT NOT NULL,
  note_type TEXT,
  title TEXT,
  summary TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
