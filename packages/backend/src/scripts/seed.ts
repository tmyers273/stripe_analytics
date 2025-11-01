#!/usr/bin/env tsx
/**
 * Database seeding script for development
 * Usage: npm run seed
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../db/schema';
import { seedDatabase } from '../__tests__/setup/seeds';
import 'dotenv/config';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('🌱 Seeding database...');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    const db = drizzle(client, { schema });

    // Clear existing data (be careful in production!)
    console.log('🧹 Clearing existing data...');
    await db.delete(schema.auditLogs);
    await db.delete(schema.sessions);
    await db.delete(schema.userIdentities);
    await db.delete(schema.organizationMembers);
    await db.delete(schema.userCredentials);
    await db.delete(schema.users);
    await db.delete(schema.organizations);

    // Seed with test data
    console.log('📝 Generating seed data...');
    await seedDatabase(db as any, {
      organizations: { count: 10 },
      users: { count: 50 },
      sessions: { count: 100 },
    });

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
