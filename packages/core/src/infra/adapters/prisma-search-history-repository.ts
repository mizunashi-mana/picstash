import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '../database/prisma.js';
import type {
  SearchHistory,
  SearchHistoryRepository,
  SearchHistoryListOptions,
  SaveSearchHistoryInput,
} from '../../application/ports/search-history-repository.js';

const DEFAULT_LIMIT = 20;
const MAX_FETCH_LIMIT = 1000;

@injectable()
export class PrismaSearchHistoryRepository implements SearchHistoryRepository {
  async save(input: SaveSearchHistoryInput): Promise<SearchHistory> {
    const normalizedQuery = input.query.trim();
    if (normalizedQuery === '') {
      throw new Error('Query cannot be empty');
    }

    // Upsert: create new or update searchedAt
    return await prisma.searchHistory.upsert({
      where: { query: normalizedQuery },
      create: {
        query: normalizedQuery,
        searchedAt: new Date(),
      },
      update: {
        searchedAt: new Date(),
      },
    });
  }

  async findByQuery(query: string): Promise<SearchHistory | null> {
    return await prisma.searchHistory.findUnique({
      where: { query: query.trim() },
    });
  }

  async findByPrefix(
    prefix: string,
    limit: number = DEFAULT_LIMIT,
  ): Promise<SearchHistory[]> {
    const normalizedPrefix = prefix.trim().toLowerCase();
    if (normalizedPrefix === '') {
      return [];
    }

    // SQLite doesn't support case-insensitive LIKE with Japanese well,
    // so we fetch recent records and filter in JS
    const all = await prisma.searchHistory.findMany({
      orderBy: { searchedAt: 'desc' },
      take: MAX_FETCH_LIMIT,
    });

    return all
      .filter(h => h.query.toLowerCase().startsWith(normalizedPrefix))
      .slice(0, limit);
  }

  async findRecent(
    options?: SearchHistoryListOptions,
  ): Promise<SearchHistory[]> {
    const limit = options?.limit ?? DEFAULT_LIMIT;

    return await prisma.searchHistory.findMany({
      orderBy: { searchedAt: 'desc' },
      take: limit,
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.searchHistory.delete({
      where: { id },
    });
  }

  async deleteAll(): Promise<void> {
    await prisma.searchHistory.deleteMany();
  }
}
