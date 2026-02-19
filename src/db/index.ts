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
