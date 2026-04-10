import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is not set. Please create a .env file with your PostgreSQL connection string.\n" +
        "Example: DATABASE_URL=postgresql://user:password@localhost:5432/zamboa"
    );
}

// SSL detection: honour ?ssl=require in the URL, or fall back to smart defaults.
const dbUrl = process.env.DATABASE_URL;
const isLocalhost =
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1");

// When the URL requires SSL (Render, Neon, or explicit ssl=require), enable SSL.
const requiresSsl =
    dbUrl.includes("ssl=require") ||
    dbUrl.includes("sslmode=require") ||
    dbUrl.includes("render.com") ||
    dbUrl.includes("neon.tech");

const pool = new Pool({
    connectionString: dbUrl,
    ...(requiresSsl
        ? { ssl: { rejectUnauthorized: false } }
        : isLocalhost
        ? {}
        : { ssl: { rejectUnauthorized: false } }),
});

pool.on("error", (err) => {
    console.error("[db] Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });
