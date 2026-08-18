import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize AgencyOS database access.");
}

const sql = postgres(connectionString, { prepare: false });
export const db = drizzle(sql, { schema });
export type AgencyDatabase = typeof db;
