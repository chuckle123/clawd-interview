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
