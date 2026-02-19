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
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
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

export function updateJobStage(jobId: number, stage: string, notes?: string) {
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
