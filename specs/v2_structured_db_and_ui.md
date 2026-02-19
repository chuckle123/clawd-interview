# Spec: v2 — Structured Database + Web UI

## Overview

Evolve the markdown-based job search system (v1) into a structured data layer with a visual dashboard. This version adds:

1. **SQLite database** — Normalized schema for companies, jobs, contacts, interviews, action items, and events. Replaces markdown-parsing with real queries.
2. **Next.js web UI** — A local dashboard showing upcoming interviews, action items, and pipeline status at a glance.
3. **Drizzle ORM** — Type-safe database access from the Next.js app, using the same SQLite file that slash commands write to.

The v1 system (slash commands, skills, company folders, prep materials) continues to work. This version adds infrastructure underneath it — the database becomes the authoritative data store, and the UI reads from it. Slash commands are updated to write to the database in addition to (or instead of) markdown files.

## Prerequisites

- Node.js 18+
- The v1 system should already be in place (company folders, slash commands, skills, prep materials)
- SQLite3 available on the system (for initial schema creation)

## Database

### Schema Design

Create `data/schema.sql`. The database lives at `data/job-search.db` (gitignored — contains personal data). Initialize with:

```bash
mkdir -p data && sqlite3 data/job-search.db < data/schema.sql
```

**Pragmas** (set at connection time):
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

### Tables

#### `companies`

The company registry. One row per company in the pipeline.

```sql
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,          -- kebab-case identifier (e.g. "elise-ai")
  name TEXT NOT NULL,                 -- display name (e.g. "EliseAI")
  website TEXT,
  readme_path TEXT,                   -- path to companies/<slug>/README.md
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `jobs`

Job postings and applications. A company can have multiple jobs (rare, but possible).

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                -- "Senior Software Engineer"
  url TEXT,                           -- job posting URL
  stage TEXT NOT NULL DEFAULT 'researching',
  tech_stack TEXT,                    -- comma-separated or free text
  applied_date TEXT,                  -- ISO date
  application_type TEXT,              -- "referral", "direct", "recruiter"
  application_content TEXT,           -- cover letter or message text
  application_file_path TEXT,         -- path to cover letter file
  notes TEXT,
  sourced_by_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Valid stages:** `researching`, `applied`, `screening`, `interviewing`, `offer`, `negotiating`, `accepted`, `rejected`, `ghosted`

#### `job_events`

Audit log of every stage change. Never deleted — this is the history.

```sql
CREATE TABLE IF NOT EXISTS job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,           -- "stage_change", "note", "contact_added"
  event_date TEXT NOT NULL DEFAULT (date('now')),
  from_value TEXT,                    -- previous stage (for stage_change)
  to_value TEXT,                      -- new stage (for stage_change)
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `contacts`

People: recruiters, interviewers, referrers. Normalized to prevent duplicates.

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  relationship TEXT,                  -- "recruiter reached out", "referral from John"
  notes TEXT,
  type TEXT,                          -- "recruiter", "interviewer", "referrer"
  agency TEXT,                        -- if external recruiter, which agency
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `interviews`

Individual interview records. Linked to jobs (not directly to companies).

```sql
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interview_date TEXT,                -- ISO date (e.g. "2026-02-19")
  interview_time TEXT,                -- 24-hour ET (e.g. "14:00", "16:30")
  type TEXT,                          -- "phone-screen", "technical", "behavioral", "system-design", "hiring-manager"
  round_number INTEGER,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled', -- "scheduled", "completed", "cancelled"
  went_well TEXT,                     -- debrief field
  could_improve TEXT,                 -- debrief field
  signals TEXT,                       -- debrief field
  follow_up_actions TEXT,             -- debrief field
  notes_path TEXT,                    -- path to interview notes file
  calendar_event_id TEXT,             -- Google Calendar event ID (for MCP linking)
  debriefed INTEGER NOT NULL DEFAULT 0, -- 0=not debriefed, 1=debriefed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Critical convention:** `interview_time` is always stored in 24-hour ET format. The display layer converts to AM/PM. This is enforced everywhere — slash commands, UI, queries.

#### `interview_participants`

Who was in the interview. Links interviews to contacts.

```sql
CREATE TABLE IF NOT EXISTS interview_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT
);
```

#### `action_items`

Things Cameron needs to do. Follows the action-items skill conventions strictly.

```sql
CREATE TABLE IF NOT EXISTS action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  job_event_id INTEGER REFERENCES job_events(id) ON DELETE SET NULL,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  due_date TEXT,                      -- ISO date
  priority INTEGER,                   -- 1=today, 2=this week, 3=when able, NULL=unranked
  snooze_until TEXT,                  -- ISO date — hidden until this date
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Snooze query** (core to the action-items skill):
```sql
SELECT id, description, priority, due_date, snooze_until
FROM action_items
WHERE completed = 0
  AND (snooze_until IS NULL OR snooze_until <= date('now'))
ORDER BY priority ASC NULLS LAST, due_date ASC NULLS LAST;
```

#### `notes`

File references linking markdown documents to database entities.

```sql
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  interview_id INTEGER REFERENCES interviews(id) ON DELETE SET NULL,
  name TEXT,
  file_path TEXT NOT NULL,            -- relative path from project root
  note_type TEXT,                     -- "readme", "interview-notes", "prep"
  title TEXT,
  summary TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Next.js Web Application

### Tech Stack

| Dependency | Version | Purpose |
|---|---|---|
| next | ^15.3.0 | Framework (App Router, React Server Components) |
| react / react-dom | ^19.0.0 | UI library |
| drizzle-orm | ^0.38.4 | Type-safe ORM for SQLite |
| better-sqlite3 | ^11.8.1 | SQLite driver (synchronous, server-side only) |
| tailwindcss | ^4.0.9 | Utility-first CSS |
| @tailwindcss/postcss | ^4.0.9 | PostCSS plugin for Tailwind v4 |
| lucide-react | ^0.474.0 | Icons |
| clsx | ^2.1.1 | Conditional classnames |
| tailwind-merge | ^3.0.2 | Merge Tailwind classes without conflicts |
| zod | ^3.24.2 | Schema validation |
| typescript | ^5.7.3 | Type safety |

### Project Setup

#### `package.json`

```json
{
  "name": "job-search",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.38.4",
    "lucide-react": "^0.474.0",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.9",
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "tailwindcss": "^4.0.9",
    "typescript": "^5.7.3"
  }
}
```

#### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
```

`better-sqlite3` is a native Node module — it must be externalized so Next.js doesn't try to bundle it for the browser.

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The `@/*` path alias maps to `src/*` for clean imports.

#### `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

Tailwind v4 uses its own PostCSS plugin (not the v3 `tailwindcss` plugin).

### Updated `.gitignore`

Add these entries to the existing v1 `.gitignore`:

```
.next/
next-env.d.ts
node_modules/
```

---

## Application Source Code

All source lives in `src/`.

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home dashboard (server component)
│   └── globals.css         # Tailwind imports + CSS custom properties
├── components/
│   ├── calendar-week-view.tsx   # Day timeline component
│   └── action-item-list.tsx     # Pending action items list
└── db/
    ├── index.ts            # Database connection (singleton)
    ├── schema.ts           # Drizzle schema (mirrors SQL)
    └── queries.ts          # All database queries
```

### Database Layer: `src/db/index.ts`

Singleton database connection that survives Next.js hot reload in development:

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "job-search.db");

function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

// Survive Next.js hot reload in dev
const globalForDb = globalThis as unknown as {
  __db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}
```

Key decisions:
- The `globalForDb` pattern prevents creating a new connection on every hot reload (Next.js dev mode re-evaluates modules)
- WAL mode is set at connection time for concurrent read/write
- Foreign keys are enforced at connection time (SQLite doesn't enforce them by default)
- The database path is relative to `process.cwd()` so it works from the project root

### Database Layer: `src/db/schema.ts`

Drizzle schema that mirrors the SQL schema exactly. Uses a shared `timestamps` helper:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
};

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  website: text("website"),
  readmePath: text("readme_path"),
  ...timestamps,
});

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  stage: text("stage").notNull().default("researching"),
  techStack: text("tech_stack"),
  appliedDate: text("applied_date"),
  applicationType: text("application_type"),
  applicationContent: text("application_content"),
  applicationFilePath: text("application_file_path"),
  notes: text("notes"),
  sourcedByContactId: integer("sourced_by_contact_id").references(
    () => contacts.id,
    { onDelete: "set null" }
  ),
  ...timestamps,
});

export const jobEvents = sqliteTable("job_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date")
    .notNull()
    .default(sql`(date('now'))`),
  fromValue: text("from_value"),
  toValue: text("to_value"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  relationship: text("relationship"),
  notes: text("notes"),
  type: text("type"),
  agency: text("agency"),
  ...timestamps,
});

export const interviews = sqliteTable("interviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  interviewDate: text("interview_date"),
  interviewTime: text("interview_time"),
  type: text("type"),
  roundNumber: integer("round_number"),
  durationMinutes: integer("duration_minutes"),
  status: text("status").notNull().default("scheduled"),
  wentWell: text("went_well"),
  couldImprove: text("could_improve"),
  signals: text("signals"),
  followUpActions: text("follow_up_actions"),
  notesPath: text("notes_path"),
  calendarEventId: text("calendar_event_id"),
  debriefed: integer("debriefed").notNull().default(0),
  ...timestamps,
});

export const interviewParticipants = sqliteTable("interview_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  interviewId: integer("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  title: text("title"),
});

export const actionItems = sqliteTable("action_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  jobEventId: integer("job_event_id").references(() => jobEvents.id, {
    onDelete: "set null",
  }),
  interviewId: integer("interview_id").references(() => interviews.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull(),
  dueDate: text("due_date"),
  priority: integer("priority"),
  snoozeUntil: text("snooze_until"),
  completed: integer("completed").notNull().default(0),
  completedAt: text("completed_at"),
  ...timestamps,
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  interviewId: integer("interview_id").references(() => interviews.id, {
    onDelete: "set null",
  }),
  name: text("name"),
  filePath: text("file_path").notNull(),
  noteType: text("note_type"),
  title: text("title"),
  summary: text("summary"),
  tags: text("tags"),
  ...timestamps,
});
```

### Database Layer: `src/db/queries.ts`

All database queries used by the UI. These are called directly from React Server Components (no API routes needed — the page runs on the server).

```typescript
import { db } from "./index";
import {
  companies,
  jobs,
  jobEvents,
  contacts,
  interviews,
  actionItems,
} from "./schema";
import { eq, and, between, asc, isNull, or, lte, sql } from "drizzle-orm";

// --- Interviews ---

export function getInterviewsInRange(start: string, end: string) {
  return db
    .select({
      id: interviews.id,
      interviewDate: interviews.interviewDate,
      interviewTime: interviews.interviewTime,
      type: interviews.type,
      durationMinutes: interviews.durationMinutes,
      status: interviews.status,
      jobTitle: jobs.title,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(interviews)
    .innerJoin(jobs, eq(interviews.jobId, jobs.id))
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(between(interviews.interviewDate, start, end))
    .orderBy(asc(interviews.interviewDate), asc(interviews.interviewTime))
    .all();
}

// --- Action Items ---

export function getPendingActionItems() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  return db
    .select({
      id: actionItems.id,
      description: actionItems.description,
      dueDate: actionItems.dueDate,
      priority: actionItems.priority,
      snoozeUntil: actionItems.snoozeUntil,
      completed: actionItems.completed,
      jobId: actionItems.jobId,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(actionItems)
    .leftJoin(jobs, eq(actionItems.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(
      and(
        eq(actionItems.completed, 0),
        or(isNull(actionItems.snoozeUntil), lte(actionItems.snoozeUntil, today))
      )
    )
    .orderBy(
      sql`${actionItems.priority} ASC NULLS LAST`,
      sql`${actionItems.dueDate} ASC NULLS LAST`
    )
    .all();
}

export function getActionItemsInRange(start: string, end: string) {
  return db
    .select({
      id: actionItems.id,
      description: actionItems.description,
      dueDate: actionItems.dueDate,
      completed: actionItems.completed,
      companyName: companies.name,
    })
    .from(actionItems)
    .leftJoin(jobs, eq(actionItems.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(
      and(
        eq(actionItems.completed, 0),
        between(actionItems.dueDate, start, end)
      )
    )
    .orderBy(asc(actionItems.dueDate))
    .all();
}

// --- Companies ---

export function findCompanyBySlug(slug: string) {
  return db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .get();
}

export function createCompany(data: {
  slug: string;
  name: string;
  website?: string;
}) {
  return db.insert(companies).values(data).returning().get();
}

// --- Contacts ---

export function findContactByEmail(email: string) {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.email, email))
    .get();
}

export function createContact(data: {
  companyId?: number;
  name: string;
  email?: string;
  type?: string;
  agency?: string;
  relationship?: string;
}) {
  return db.insert(contacts).values(data).returning().get();
}

// --- Jobs ---

export function createJob(data: {
  companyId: number;
  title: string;
  stage?: string;
  url?: string;
  sourcedByContactId?: number;
}) {
  return db.insert(jobs).values(data).returning().get();
}

export function updateJobStage(
  jobId: number,
  stage: string,
  notes?: string
) {
  const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
  if (!job) return null;

  db.update(jobs)
    .set({ stage, updatedAt: new Date().toISOString() })
    .where(eq(jobs.id, jobId))
    .run();

  db.insert(jobEvents)
    .values({
      jobId,
      eventType: "stage_change",
      fromValue: job.stage,
      toValue: stage,
      notes,
    })
    .run();

  return { ...job, stage };
}

export function findJobByCompanySlug(companySlug: string) {
  const company = findCompanyBySlug(companySlug);
  if (!company) return null;
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.companyId, company.id))
    .get();
}

// --- Action Items ---

export function createActionItem(data: {
  jobId?: number;
  jobEventId?: number;
  interviewId?: number;
  description: string;
  dueDate?: string;
}) {
  return db.insert(actionItems).values(data).returning().get();
}

// --- Job Events ---

export function createJobEvent(data: {
  jobId: number;
  eventType: string;
  fromValue?: string;
  toValue?: string;
  notes?: string;
}) {
  return db.insert(jobEvents).values(data).returning().get();
}

// --- Interviews ---

export function createInterview(data: {
  jobId: number;
  interviewDate?: string;
  interviewTime?: string;
  type?: string;
  durationMinutes?: number;
}) {
  return db.insert(interviews).values(data).returning().get();
}
```

---

### UI: `src/app/globals.css`

Minimal CSS with custom properties for light/dark theming:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e5e5;
  --accent-blue: #3b82f6;
  --accent-amber: #f59e0b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --muted: #1a1a1a;
    --muted-foreground: #a3a3a3;
    --border: #262626;
    --accent-blue: #60a5fa;
    --accent-amber: #fbbf24;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, sans-serif;
}
```

Design decisions:
- Uses CSS custom properties (not Tailwind theme config) for simplicity with Tailwind v4
- Dark mode follows system preference via `prefers-color-scheme`
- Two accent colors: blue for interviews/calendar, amber for action items
- System font stack — no custom font loading

### UI: `src/app/layout.tsx`

Root layout with metadata and centered content container:

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Search OS",
  description: "Job search pipeline and interview tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

### UI: `src/app/page.tsx` — Home Dashboard

The main page is a React Server Component. It queries the database directly (no API layer, no `use client`). All data fetching happens at render time.

```typescript
import { getInterviewsInRange, getPendingActionItems, getActionItemsInRange } from "@/db/queries";
import { DayTimeline } from "@/components/calendar-week-view";
import { ActionItemList } from "@/components/action-item-list";

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function getLookaheadRange(): { startStr: string; endStr: string } {
  const startStr = todayET();
  const end = new Date(startStr + "T12:00:00");
  end.setDate(end.getDate() + 30);
  return {
    startStr,
    endStr: end.toISOString().split("T")[0],
  };
}

function getActiveDays(
  todayStr: string,
  interviews: { interviewDate: string | null }[],
  actionItems: { dueDate: string | null }[],
): string[] {
  const datesWithEvents = new Set<string>();
  for (const iv of interviews) {
    if (iv.interviewDate && iv.interviewDate >= todayStr) datesWithEvents.add(iv.interviewDate);
  }
  for (const ai of actionItems) {
    if (ai.dueDate && ai.dueDate >= todayStr) datesWithEvents.add(ai.dueDate);
  }
  // Always include today, then up to 3 more days with events
  const futureDays = [...datesWithEvents]
    .filter((d) => d > todayStr)
    .sort();
  const days = [todayStr, ...futureDays.slice(0, 3)];
  return days;
}

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { startStr, endStr } = getLookaheadRange();

  const interviews = getInterviewsInRange(startStr, endStr);
  const actionItemsForCalendar = getActionItemsInRange(startStr, endStr);
  const pendingActionItems = getPendingActionItems();

  const todayStr = startStr;
  const activeDays = getActiveDays(todayStr, interviews, actionItemsForCalendar);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Job Search OS</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            timeZone: "America/New_York",
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
        <DayTimeline
          days={activeDays}
          interviews={interviews}
          actionItems={actionItemsForCalendar}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Action Items ({pendingActionItems.length})
        </h2>
        <ActionItemList items={pendingActionItems} />
      </section>
    </div>
  );
}
```

Key decisions:
- `export const dynamic = "force-dynamic"` — disables static generation. The page must query the database on every request to show current data.
- **Lookahead logic:** Queries 30 days ahead, but only displays today + up to 3 future days that have events. This keeps the view focused.
- **All dates are ET:** `todayET()` uses `America/New_York` timezone consistently.
- No `use client` — this is a pure server component. The database queries run server-side.

### UI: `src/components/calendar-week-view.tsx` — Day Timeline

Renders a timeline of days with interviews and action items grouped by date:

```typescript
import { Circle } from "lucide-react";

type Interview = {
  id: number;
  interviewDate: string | null;
  interviewTime: string | null;
  type: string | null;
  durationMinutes: number | null;
  companyName: string;
  companySlug: string;
};

type ActionItem = {
  id: number;
  description: string;
  dueDate: string | null;
  companyName: string | null;
};

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month} ${d.getDate()}`;
}

function formatTimeAmPm(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}
```

Component renders:
- **Day headers** with date ("Mon Feb 19") and a "Today" badge for the current day (accent blue)
- **Interviews** with a blue left border, showing time (24h→AM/PM conversion), company name, type, and duration
- **Action items** with an amber left border and circle icon, showing description and company name
- **Empty days** show "No events" in muted text

### UI: `src/components/action-item-list.tsx` — Action Items

Renders the full pending action items list (not filtered by date range like the timeline):

```typescript
import { Circle } from "lucide-react";

type ActionItem = {
  id: number;
  description: string;
  dueDate: string | null;
  completed: number;
  companyName: string | null;
  companySlug: string | null;
};
```

Features:
- Items are pre-sorted by the query (priority ASC NULLS LAST, due date ASC NULLS LAST)
- Each item shows: description, company name (if linked), due date
- **Overdue dates are red:** If `dueDate < today`, the date text gets `text-red-500`
- Empty state: "No pending action items." centered in muted text
- Uses `divide-y` for clean separators between items

---

## Slash Command Updates for v2

The v1 slash commands need to be updated to write to the database. The key changes:

### `/new-company`

After creating the company folder, also:
- Insert a row into `companies` with the slug and display name
- Insert a row into `jobs` if a job posting was provided (title, URL, stage=researching)
- Insert rows into `notes` linking the README and interview-notes files

### `/track`

**Update mode:** Use `updateJobStage()` to change the stage and automatically log a `job_events` entry.

**Overview mode:** Query `companies` + `jobs` + `job_events` instead of parsing markdown files. The database is now the source of truth for stage and dates. Still read company READMEs for narrative context.

### `/debrief`

After collecting responses:
- Insert into `interviews` (date, type, duration, status=completed, debrief fields, debriefed=1)
- Insert into `interview_participants` for each interviewer
- Insert into `contacts` for new people
- Insert into `action_items` for follow-ups (with priority per skill conventions)

### `/daily-prep`

- Query `interviews` for today's interviews instead of scanning folders
- Query `action_items` with the snooze-aware filter for the action items section
- Query interviews where `status = 'completed' AND debriefed = 0` for the needs-debrief section

### `/prep`

- Load company data from the database (tech stack, contacts, past interviews, events)
- Still read company folder README and prep materials from `prep/`

---

## Design Principles

1. **Database is the structured truth, folders are the narrative truth.** The database stores queryable facts (stages, dates, contacts). Company folders store rich context (research, fit assessment, interview notes). Both are maintained in sync.

2. **Server components, no API layer.** The dashboard reads directly from SQLite via Drizzle in React Server Components. No REST endpoints, no client-side fetching. The page is the API.

3. **ET timezone everywhere.** All dates/times are Eastern Time. Interview times are stored 24h in the DB, converted to AM/PM only on the display layer.

4. **Action items follow strict conventions.** The action-items skill defines what is and isn't an action item. The database schema and queries enforce the snooze/priority/sort logic. The UI renders them accordingly.

5. **`force-dynamic` for freshness.** The dashboard always queries live data. No caching, no static generation. This is a personal tool — freshness matters more than performance.

6. **Minimal UI, maximum utility.** Two sections: upcoming timeline and action items. No navigation, no settings page, no auth. It's a local dashboard for one person.
