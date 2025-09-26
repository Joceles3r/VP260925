import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the connection
const sql = neon(process.env.DATABASE_URL);

// Create the database instance with schema
export const db = drizzle(sql, { schema });

// Export database for use in other modules
export type Database = typeof db;
export default db;