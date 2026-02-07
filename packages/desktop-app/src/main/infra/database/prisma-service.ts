/**
 * Prisma database service for desktop-app.
 * Manages the Prisma client connection lifecycle.
 */

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@~generated/prisma/client.js';

/**
 * Service that manages the Prisma database connection.
 */
export class PrismaService {
  private readonly client: PrismaClient;

  constructor(dbPath: string) {
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    this.client = new PrismaClient({ adapter });
  }

  /**
   * Get the Prisma client instance.
   */
  getClient(): PrismaClient {
    return this.client;
  }

  /**
   * Connect to the database.
   */
  async connect(): Promise<void> {
    await this.client.$connect();
  }

  /**
   * Disconnect from the database.
   */
  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}
