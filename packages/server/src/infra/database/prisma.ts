import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@~generated/prisma/client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Prisma 7.x: SQLite requires driver adapter
// Path is relative to this file's location in dist or src
const dbPath = resolve(__dirname, '../../..', 'prisma/data/picstash.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

export const prisma = new PrismaClient({ adapter });

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
