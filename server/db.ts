import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is not set. Please create a .env file with your PostgreSQL connection string.\n" +
        "Example: DATABASE_URL=postgresql://user:password@localhost:5432/zamboa"
    );
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
