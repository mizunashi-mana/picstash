/**
 * Injectable Prisma service that manages the database connection.
 */

import 'reflect-metadata';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import { Prisma, PrismaClient } from '@~generated/prisma/client.js';
import type { CoreConfig } from '@/config.js';

// Re-export Prisma namespace for error handling (e.g., PrismaClientKnownRequestError)
export { Prisma };

/**
 * Injectable service that manages the Prisma database connection.
 */
@injectable()
export class PrismaService {
  private readonly client: PrismaClient;

  constructor(@inject(TYPES.Config) config: CoreConfig) {
    const adapter = new PrismaBetterSqlite3({ url: `file:${config.database.path}` });
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
