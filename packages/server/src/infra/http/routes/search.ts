import { prisma } from '@/infra/database/prisma.js';
import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

interface SuggestionsQuery {
  q?: string;
}

interface Suggestion {
  type: 'label' | 'keyword';
  value: string;
}

const MAX_SUGGESTIONS = 10;
const MIN_QUERY_LENGTH = 1;

export function searchRoutes(app: FastifyInstance, _container: AppContainer): void {
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

      // Search labels by name (prefix match, case-insensitive)
      // SQLite doesn't support case-insensitive mode, so we fetch all and filter in JS
      const allLabels = await prisma.attributeLabel.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      });

      for (const label of allLabels) {
        if (label.name.toLowerCase().startsWith(query)) {
          const key = `label:${label.name.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({ type: 'label', value: label.name });
            if (suggestions.length >= MAX_SUGGESTIONS) {
              break;
            }
          }
        }
      }

      // Search keywords from image attributes
      // Keywords are stored as comma-separated strings
      const attributes = await prisma.imageAttribute.findMany({
        where: {
          keywords: {
            not: null,
          },
        },
        select: { keywords: true },
      });

      // Extract and filter keywords
      for (const attr of attributes) {
        if (attr.keywords === null) continue;

        const keywords = attr.keywords.split(',').map(k => k.trim()).filter(k => k !== '');
        for (const keyword of keywords) {
          if (keyword.toLowerCase().startsWith(query)) {
            const key = `keyword:${keyword.toLowerCase()}`;
            if (!seen.has(key)) {
              seen.add(key);
              suggestions.push({ type: 'keyword', value: keyword });

              // Stop if we have enough suggestions
              if (suggestions.length >= MAX_SUGGESTIONS) {
                break;
              }
            }
          }
        }

        if (suggestions.length >= MAX_SUGGESTIONS) {
          break;
        }
      }

      // Sort suggestions: labels first, then keywords, both alphabetically
      suggestions.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'label' ? -1 : 1;
        }
        return a.value.localeCompare(b.value, 'ja');
      });

      // Limit to max suggestions
      const limitedSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);

      return await reply.send({ suggestions: limitedSuggestions });
    },
  );
}
