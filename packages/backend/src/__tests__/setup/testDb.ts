import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../db/schema';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

let globalDb: PGlite | null = null;

/**
 * Creates an in-memory PGlite database for testing
 * @returns A Drizzle ORM instance connected to PGlite
 */
export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();

  // Create Drizzle instance with schema
  const db = drizzle(client, { schema });

  // Run migrations programmatically
  await runMigrations(client);

  return db;
}

/**
 * Creates a global test database that persists across tests
 * Use this with beforeAll/afterAll for better performance
 */
export async function getGlobalTestDb(): Promise<TestDb> {
  if (!globalDb) {
    globalDb = new PGlite();
    await runMigrations(globalDb);
  }

  return drizzle(globalDb, { schema });
}

/**
 * Cleans up the global test database
 */
export async function closeGlobalTestDb(): Promise<void> {
  if (globalDb) {
    await globalDb.close();
    globalDb = null;
  }
}

/**
 * Runs migrations on a PGlite instance
 */
async function runMigrations(client: PGlite): Promise<void> {
  const migrationsFolder = join(process.cwd(), 'src/db/migrations');

  try {
    // Read all SQL files from migrations folder
    const files = await readdir(migrationsFolder);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    // Execute each migration in order
    for (const file of sqlFiles) {
      let sql = await readFile(join(migrationsFolder, file), 'utf-8');

      // Remove pgcrypto extension requirement for PGlite
      // PGlite has gen_random_uuid() built-in
      sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";?\s*/gi, '');

      await client.exec(sql);
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

/**
 * Clears all data from tables while preserving schema
 * Useful for test cleanup between tests
 */
export async function clearDatabase(db: TestDb): Promise<void> {
  await db.delete(schema.auditLogs);
  await db.delete(schema.sessions);
  await db.delete(schema.userIdentities);
  await db.delete(schema.organizationMembers);
  await db.delete(schema.userCredentials);
  await db.delete(schema.users);
  await db.delete(schema.organizations);
}
