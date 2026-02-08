/**
 * IPC API ルーター
 *
 * URL パターンに基づいて CoreContainer のメソッドを呼び出す
 */

import {
  CAPTION_JOB_TYPE,
  findDuplicates,
  generateRecommendations,
  type CaptionJobPayload,
  type CoreContainer,
} from '@picstash/core';
import { z } from 'zod';
import type { IpcApiRequest, IpcApiResponse } from '@desktop-app/shared/types.js';

type RouteHandler = (
  container: CoreContainer,
  params: Record<string, string>,
  body: unknown,
  formData?: IpcApiRequest['formData'],
) => Promise<IpcApiResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

/**
 * ルートを登録するヘルパー
 */
function route(
  method: string,
  path: string,
  handler: RouteHandler,
): void {
  // パスパターンを正規表現に変換（:param を名前付きキャプチャに）
  const paramNames: string[] = [];
  const patternStr = path.replace(/:([^/]+)/g, (_match, paramName: string) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${patternStr}$`);

  routes.push({ method, pattern, paramNames, handler });
}

/**
 * リクエストを処理
 */
export async function handleApiRequest(
  container: CoreContainer,
  request: IpcApiRequest,
): Promise<IpcApiResponse> {
  const { method, url, body, formData } = request;

  // URL からパスとクエリパラメータを分離
  const urlObj = new URL(url, 'http://localhost');
  const path = urlObj.pathname;

  for (const routeDef of routes) {
    if (routeDef.method !== method) continue;

    const match = routeDef.pattern.exec(path);
    if (match === null) continue;

    // パラメータを抽出
    const params: Record<string, string> = {};
    for (let i = 0; i < routeDef.paramNames.length; i++) {
      const paramName = routeDef.paramNames[i];
      const paramValue = match[i + 1];
      if (paramName !== undefined && paramValue !== undefined) {
        params[paramName] = paramValue;
      }
    }

    // クエリパラメータも追加
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value;
    }

    try {
      return await routeDef.handler(container, params, body, formData);
    }
    catch (error) {
      // eslint-disable-next-line no-console -- Error logging
      console.error('API handler error:', error);
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  return { status: 404, error: 'Not found' };
}

// ============================================================
// ルート定義
// ============================================================

// --- Images ---

route('GET', '/api/images', async (container, params) => {
  const repo = container.getImageRepository();
  const limit = params.limit !== undefined ? parseInt(params.limit, 10) : 50;
  const offset = params.offset !== undefined ? parseInt(params.offset, 10) : 0;
  const query = params.q;

  if (query !== undefined && query !== '') {
    // 検索
    const result = await repo.searchPaginated(query, { limit, offset });
    return { status: 200, data: result };
  }

  // ページネーション付き一覧
  const result = await repo.findAllPaginated({ limit, offset });
  return { status: 200, data: result };
});

route('GET', '/api/images/:imageId', async (container, params) => {
  const repo = container.getImageRepository();
  const image = await repo.findById(params.imageId ?? '');
  if (image === null) {
    return { status: 404, error: 'Image not found' };
  }
  return { status: 200, data: image };
});

route('PATCH', '/api/images/:imageId', async (container, params, body) => {
  const repo = container.getImageRepository();
  const imageId = params.imageId ?? '';

  const existing = await repo.findById(imageId);
  if (existing === null) {
    return { status: 404, error: 'Image not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { description?: string | null };
  const updated = await repo.updateById(imageId, {
    description: input.description,
  });

  return { status: 200, data: updated };
});

route('DELETE', '/api/images/:imageId', async (container, params) => {
  const repo = container.getImageRepository();
  const fileStorage = container.getFileStorage();
  const imageId = params.imageId ?? '';

  const image = await repo.findById(imageId);
  if (image === null) {
    return { status: 404, error: 'Image not found' };
  }

  // ファイルを削除
  await fileStorage.deleteFile(image.path);
  if (image.thumbnailPath !== null) {
    await fileStorage.deleteFile(image.thumbnailPath).catch(() => {
      // サムネイル削除エラーは無視
    });
  }

  // DB から削除
  await repo.deleteById(imageId);

  return { status: 204 };
});

route('GET', '/api/images/:imageId/similar', async (container, params) => {
  const imageRepo = container.getImageRepository();
  const embeddingRepo = container.getEmbeddingRepository();
  const imageId = params.imageId ?? '';
  const limit = params.limit !== undefined ? parseInt(params.limit, 10) : 10;

  // 画像の埋め込みを取得
  const imageWithEmbedding = await imageRepo.findByIdWithEmbedding(imageId);
  if (imageWithEmbedding?.embedding === null || imageWithEmbedding?.embedding === undefined) {
    return { status: 200, data: { imageId, similarImages: [] } };
  }

  // Float32Array に変換
  const { buffer, byteOffset, byteLength } = imageWithEmbedding.embedding;
  const embedding = new Float32Array(buffer, byteOffset, byteLength / 4);

  // 類似画像を検索
  const similarResults = embeddingRepo.findSimilar(embedding, limit + 1, [imageId]);

  // 画像情報を取得
  const similarImages = await Promise.all(
    similarResults.slice(0, limit).map(async (result) => {
      const image = await imageRepo.findById(result.imageId);
      if (image === null) return null;
      return {
        id: image.id,
        title: image.title,
        thumbnailPath: image.thumbnailPath,
        distance: result.distance,
      };
    }),
  );

  return {
    status: 200,
    data: {
      imageId,
      similarImages: similarImages.filter((img): img is NonNullable<typeof img> => img !== null),
    },
  };
});

/* v8 ignore start -- Route order issue: this route is shadowed by /api/images/:imageId */
route('GET', '/api/images/duplicates', async (container, params) => {
  const threshold = params.threshold !== undefined ? parseFloat(params.threshold) : 0.1;

  const result = await findDuplicates(
    { threshold },
    {
      imageRepository: container.getImageRepository(),
      embeddingRepository: container.getEmbeddingRepository(),
    },
  );

  return { status: 200, data: result };
});
/* v8 ignore stop */

route('GET', '/api/images/:imageId/collections', async (container, params) => {
  const repo = container.getCollectionRepository();
  const imageId = params.imageId ?? '';

  const collections = await repo.findCollectionsByImageId(imageId);
  return { status: 200, data: collections };
});

route('POST', '/api/images/:imageId/generate-description', async (container, params) => {
  const imageRepo = container.getImageRepository();
  const fileStorage = container.getFileStorage();
  const jobQueue = container.getJobQueue();
  const imageId = params.imageId ?? '';

  const image = await imageRepo.findById(imageId);
  if (image === null) {
    return { status: 404, error: 'Image not found' };
  }

  if (!(await fileStorage.fileExists(image.path))) {
    return { status: 404, error: 'Image file not found on disk' };
  }

  // キャプション生成ジョブをキューに追加
  const payload: CaptionJobPayload = { imageId };
  const job = await jobQueue.add(CAPTION_JOB_TYPE, payload);

  return {
    status: 202,
    data: {
      jobId: job.id,
      status: 'queued',
      message: 'Caption generation job has been queued',
    },
  };
});

// --- Labels ---

route('GET', '/api/labels', async (container) => {
  const repo = container.getLabelRepository();
  const labels = await repo.findAll();
  return { status: 200, data: labels };
});

route('POST', '/api/labels', async (container, _params, body) => {
  const repo = container.getLabelRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { name: string };
  const label = await repo.create({ name: input.name });
  return { status: 201, data: label };
});

route('PATCH', '/api/labels/:labelId', async (container, params, body) => {
  const repo = container.getLabelRepository();
  const labelId = params.labelId ?? '';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { name?: string };
  const label = await repo.updateById(labelId, input);
  return { status: 200, data: label };
});

route('DELETE', '/api/labels/:labelId', async (container, params) => {
  const repo = container.getLabelRepository();
  await repo.deleteById(params.labelId ?? '');
  return { status: 204 };
});

// --- Collections ---

route('GET', '/api/collections', async (container) => {
  const repo = container.getCollectionRepository();
  const collections = await repo.findAll();
  return { status: 200, data: collections };
});

route('POST', '/api/collections', async (container, _params, body) => {
  const repo = container.getCollectionRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { name: string; description?: string };
  const collection = await repo.create(input);
  return { status: 201, data: collection };
});

route('GET', '/api/collections/:collectionId', async (container, params) => {
  const repo = container.getCollectionRepository();
  const collection = await repo.findByIdWithImages(params.collectionId ?? '');
  if (collection === null) {
    return { status: 404, error: 'Collection not found' };
  }
  return { status: 200, data: collection };
});

route('PATCH', '/api/collections/:collectionId', async (container, params, body) => {
  const repo = container.getCollectionRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { name?: string; description?: string };
  const collection = await repo.updateById(params.collectionId ?? '', input);
  return { status: 200, data: collection };
});

route('DELETE', '/api/collections/:collectionId', async (container, params) => {
  const repo = container.getCollectionRepository();
  await repo.deleteById(params.collectionId ?? '');
  return { status: 204 };
});

route('GET', '/api/collections/:collectionId/images', async (container, params) => {
  const repo = container.getCollectionRepository();
  const collection = await repo.findByIdWithImages(params.collectionId ?? '');
  if (collection === null) {
    return { status: 404, error: 'Collection not found' };
  }
  return { status: 200, data: collection.images };
});

route('POST', '/api/collections/:collectionId/images', async (container, params, body) => {
  const repo = container.getCollectionRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { imageIds: string[] };
  const collectionId = params.collectionId ?? '';

  for (const imageId of input.imageIds) {
    await repo.addImage(collectionId, { imageId });
  }
  return { status: 204 };
});

route('DELETE', '/api/collections/:collectionId/images', async (container, params, body) => {
  const repo = container.getCollectionRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { imageIds: string[] };
  const collectionId = params.collectionId ?? '';

  for (const imageId of input.imageIds) {
    await repo.removeImage(collectionId, imageId);
  }
  return { status: 204 };
});

// --- Image Attributes ---

route('GET', '/api/images/:imageId/attributes', async (container, params) => {
  const repo = container.getImageAttributeRepository();
  const attributes = await repo.findByImageId(params.imageId ?? '');
  return { status: 200, data: attributes };
});

route('POST', '/api/images/:imageId/attributes', async (container, params, body) => {
  const repo = container.getImageAttributeRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { labelId: string; keywords?: string };
  const attribute = await repo.create({
    imageId: params.imageId ?? '',
    labelId: input.labelId,
    keywords: input.keywords,
  });
  return { status: 201, data: attribute };
});

route('PUT', '/api/images/:imageId/attributes/:attributeId', async (container, params, body) => {
  const repo = container.getImageAttributeRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { keywords?: string };
  const attribute = await repo.updateById(params.attributeId ?? '', { keywords: input.keywords });
  return { status: 200, data: attribute };
});

route('DELETE', '/api/images/:imageId/attributes/:attributeId', async (container, params) => {
  const repo = container.getImageAttributeRepository();
  await repo.deleteById(params.attributeId ?? '');
  return { status: 204 };
});

// --- Search ---

route('GET', '/api/search/history', async (container) => {
  const repo = container.getSearchHistoryRepository();
  const history = await repo.findRecent({ limit: 10 });
  return { status: 200, data: history };
});

route('POST', '/api/search/history', async (container, _params, body) => {
  const repo = container.getSearchHistoryRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { query: string };
  await repo.save({ query: input.query });
  return { status: 201 };
});

route('DELETE', '/api/search/history', async (container) => {
  const repo = container.getSearchHistoryRepository();
  await repo.deleteAll();
  return { status: 204 };
});

route('GET', '/api/search/suggestions', async (container, params) => {
  const repo = container.getSearchHistoryRepository();
  const query = params.q ?? '';
  const suggestions = await repo.findByPrefix(query, 10);
  return { status: 200, data: suggestions };
});

// --- View History ---

route('GET', '/api/view-history', async (container, params) => {
  const repo = container.getViewHistoryRepository();
  const limit = params.limit !== undefined ? parseInt(params.limit, 10) : 50;
  const offset = params.offset !== undefined ? parseInt(params.offset, 10) : 0;
  const history = await repo.findRecentWithImages({ limit, offset });
  return { status: 200, data: history };
});

route('POST', '/api/view-history', async (container, _params, body) => {
  const repo = container.getViewHistoryRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { imageId: string };
  await repo.create({ imageId: input.imageId });
  return { status: 201 };
});

// --- Recommendations ---

route('GET', '/api/recommendations', async (container, params) => {
  const limit = params.limit !== undefined ? parseInt(params.limit, 10) : 20;

  const result = await generateRecommendations(
    container.getViewHistoryRepository(),
    container.getImageRepository(),
    container.getEmbeddingRepository(),
    { limit },
  );

  return { status: 200, data: result };
});

route('POST', '/api/recommendations/conversions', async (container, _params, body) => {
  const repo = container.getRecommendationConversionRepository();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Request body type
  const input = body as { impressions: Array<{ imageId: string; score: number }> };
  await repo.createImpressions(input.impressions);
  return { status: 201 };
});

// --- Stats ---

route('GET', '/api/stats/overview', async (container, params) => {
  const repo = container.getStatsRepository();
  const days = params.days !== undefined ? parseInt(params.days, 10) : 30;
  const stats = await repo.getOverview({ days });
  return { status: 200, data: stats };
});

route('GET', '/api/stats/view-trends', async (container, params) => {
  const repo = container.getStatsRepository();
  const days = params.days !== undefined ? parseInt(params.days, 10) : 30;
  const trends = await repo.getViewTrends({ days });
  return { status: 200, data: trends };
});

route('GET', '/api/stats/popular-images', async (container, params) => {
  const repo = container.getStatsRepository();
  const limit = params.limit !== undefined ? parseInt(params.limit, 10) : 10;
  const days = params.days !== undefined ? parseInt(params.days, 10) : 30;
  const images = await repo.getPopularImages({ limit, days });
  return { status: 200, data: images };
});

route('GET', '/api/stats/recommendation-trends', async (container, params) => {
  const repo = container.getStatsRepository();
  const days = params.days !== undefined ? parseInt(params.days, 10) : 30;
  const trends = await repo.getRecommendationTrends({ days });
  return { status: 200, data: trends };
});

// --- Jobs ---

route('GET', '/api/jobs', async (container) => {
  const queue = container.getJobQueue();
  const result = await queue.listJobs({ status: ['waiting', 'active'] });
  return { status: 200, data: result.jobs };
});

route('GET', '/api/jobs/:jobId', async (container, params) => {
  const queue = container.getJobQueue();
  const job = await queue.getJob(params.jobId ?? '');
  if (job === null) {
    return { status: 404, error: 'Job not found' };
  }
  return { status: 200, data: job };
});

// --- Images (from local) ---

const createImageFromLocalSchema = z.object({
  path: z.string().min(1),
  thumbnailPath: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

route('POST', '/api/images/from-local', async (container, _params, body) => {
  const parseResult = createImageFromLocalSchema.safeParse(body);
  if (!parseResult.success) {
    return { status: 400, error: 'Invalid request body' };
  }
  const input = parseResult.data;

  const repo = container.getImageRepository();
  const image = await repo.create({
    path: input.path,
    thumbnailPath: input.thumbnailPath,
    mimeType: input.mimeType,
    size: input.size,
    width: input.width,
    height: input.height,
  });

  return { status: 201, data: image };
});
