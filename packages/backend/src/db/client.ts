import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getConfig } from '../config';

const { DATABASE_URL } = getConfig();

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: shouldUseSSL(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);

function shouldUseSSL(connectionString: string): boolean {
  return !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
}
