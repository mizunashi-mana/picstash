import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { PrismaService } from '@/infra/database/index.js';
import type {
  LabelRepository,
  SearchHistoryRepository,
} from '@picstash/core';
import type { FastifyInstance } from 'fastify';

interface SuggestionsQuery {
  q?: string;
}

interface SaveHistoryBody {
  query: string;
}

interface DeleteHistoryParams {
  id: string;
}

interface Suggestion {
  type: 'label' | 'keyword' | 'history';
  value: string;
  id?: string; // history ID for deletion
}

const MAX_SUGGESTIONS = 10;
const MIN_QUERY_LENGTH = 1;
const MAX_HISTORY_SUGGESTIONS = 5;

@injectable()
export class SearchController {
  constructor(
    @inject(TYPES.SearchHistoryRepository)
    private readonly searchHistoryRepository: SearchHistoryRepository,
    @inject(TYPES.LabelRepository)
    private readonly labelRepository: LabelRepository,
    @inject(TYPES.DatabaseService)
    private readonly prismaService: PrismaService,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Get search suggestions (autocomplete)
    app.get<{ Querystring: SuggestionsQuery }>(
      '/api/search/suggestions',
      async (request, reply) => {
        const { q } = request.query;

        // Return empty if query is too short
        if (q === undefined || q.trim().length < MIN_QUERY_LENGTH) {
          return await reply.send({ suggestions: [] });
        }

        const query = q.trim().toLowerCase();
        const suggestions: Suggestion[] = [];
        const seen = new Set<string>();

        // 1. Search history (highest priority, show recent first)
        const historyMatches = await this.searchHistoryRepository.findByPrefix(
          query,
          MAX_HISTORY_SUGGESTIONS,
        );

        for (const history of historyMatches) {
          const key = `history:${history.query.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({
              type: 'history',
              value: history.query,
              id: history.id,
            });
          }
        }

        // 2. Search labels by name (prefix match, case-insensitive)
        // SQLite doesn't support case-insensitive mode, so we fetch all and filter in JS
        const allLabels = await this.labelRepository.findAll();

        for (const label of allLabels) {
          if (label.name.toLowerCase().startsWith(query)) {
            const key = `label:${label.name.toLowerCase()}`;
            // Skip if already in history
            if (!seen.has(key) && !seen.has(`history:${label.name.toLowerCase()}`)) {
              seen.add(key);
              suggestions.push({ type: 'label', value: label.name });
              if (suggestions.length >= MAX_SUGGESTIONS) {
                break;
              }
            }
          }
        }

        // 3. Search keywords from image attributes
        // Keywords are stored as comma-separated strings
        if (suggestions.length < MAX_SUGGESTIONS) {
          const attributes = await this.prismaService.getClient().imageAttribute.findMany({
            where: {
              keywords: {
                not: null,
              },
            },
            select: { keywords: true },
          });

          // Extract and filter keywords
          const keywordSuggestions = this.extractKeywordSuggestions(
            attributes,
            query,
            seen,
            MAX_SUGGESTIONS - suggestions.length,
          );
          suggestions.push(...keywordSuggestions);
        }

        // Sort suggestions: history first, then labels, then keywords
        // Within each type, maintain existing order (history: recent first, others: alphabetically)
        suggestions.sort((a, b) => {
          const typeOrder = { history: 0, label: 1, keyword: 2 };
          if (a.type !== b.type) {
            return typeOrder[a.type] - typeOrder[b.type];
          }
          // For history, maintain the order (already sorted by recent)
          if (a.type === 'history') {
            return 0;
          }
          // For labels and keywords, sort alphabetically
          return a.value.localeCompare(b.value, 'ja');
        });

        // Limit to MAX_SUGGESTIONS
        return await reply.send({ suggestions: suggestions.slice(0, MAX_SUGGESTIONS) });
      },
    );

    // Save search history
    app.post<{ Body: SaveHistoryBody }>(
      '/api/search/history',
      async (request, reply) => {
        const body: unknown = request.body;

        if (
          typeof body !== 'object'
          || body === null
          || !('query' in body)
          || typeof body.query !== 'string'
        ) {
          return await reply.status(400).send({ error: 'Invalid request body' });
        }

        const query = body.query.trim();

        if (query === '') {
          return await reply.status(400).send({ error: 'Query is required' });
        }

        const history = await this.searchHistoryRepository.save({ query });
        return await reply.status(201).send(history);
      },
    );

    // Get recent search history
    app.get('/api/search/history', async (_request, reply) => {
      const history = await this.searchHistoryRepository.findRecent({ limit: 50 });
      return await reply.send({ history });
    });

    // Delete single search history entry
    app.delete<{ Params: DeleteHistoryParams }>(
      '/api/search/history/:id',
      async (request, reply) => {
        const { id } = request.params;

        try {
          await this.searchHistoryRepository.deleteById(id);
          return await reply.status(204).send();
        }
        catch {
          return await reply.status(404).send({ error: 'History not found' });
        }
      },
    );

    // Delete all search history
    app.delete('/api/search/history', async (_request, reply) => {
      await this.searchHistoryRepository.deleteAll();
      return await reply.status(204).send();
    });
  }

  /**
   * Extract keyword suggestions from image attributes
   */
  private extractKeywordSuggestions(
    attributes: Array<{ keywords: string | null }>,
    query: string,
    seen: Set<string>,
    limit: number,
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    for (const attr of attributes) {
      if (attr.keywords === null) continue;

      const keywords = attr.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k !== '');

      for (const keyword of keywords) {
        if (!keyword.toLowerCase().startsWith(query)) continue;

        const key = `keyword:${keyword.toLowerCase()}`;
        const historyKey = `history:${keyword.toLowerCase()}`;
        const labelKey = `label:${keyword.toLowerCase()}`;

        // Skip if already seen
        if (seen.has(key) || seen.has(historyKey) || seen.has(labelKey)) continue;

        seen.add(key);
        suggestions.push({ type: 'keyword', value: keyword });

        if (suggestions.length >= limit) {
          return suggestions;
        }
      }

      if (suggestions.length >= limit) {
        break;
      }
    }

    return suggestions;
  }
}
