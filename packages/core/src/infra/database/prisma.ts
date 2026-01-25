import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { Prisma, PrismaClient } from '@~generated/prisma/client.js';

// Re-export Prisma namespace for error handling (e.g., PrismaClientKnownRequestError)
export { Prisma };

let prismaClient: PrismaClient | null = null;

/**
 * Get the Prisma client instance.
 * Throws if initializeDatabase() has not been called.
 */
export function getPrisma(): PrismaClient {
  if (prismaClient === null) {
    throw new Error(
      'Database not initialized. Call initializeDatabase(dbPath) first.',
    );
  }
  return prismaClient;
}

/**
 * Initialize the database with the given path.
 * Must be called before using getPrisma() or connectDatabase().
 * @param dbPath - Absolute path to the SQLite database file
 */
export function initializeDatabase(dbPath: string): void {
  if (prismaClient !== null) {
    return; // Already initialized
  }
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  prismaClient = new PrismaClient({ adapter });
}

/**
 * Connect to the database.
 * Requires initializeDatabase() to be called first.
 */
export async function connectDatabase(): Promise<void> {
  await getPrisma().$connect();
}

/**
 * Disconnect from the database.
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaClient !== null) {
    await prismaClient.$disconnect();
  }
}
