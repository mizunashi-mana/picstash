import { beforeEach, describe, expect, it, vi } from 'vitest';

// @picstash/core モック
const mockFindDuplicates = vi.fn();
const mockGenerateRecommendations = vi.fn();

vi.mock('@picstash/core', () => ({
  findDuplicates: (...args: unknown[]) => mockFindDuplicates(...args),
  generateRecommendations: (...args: unknown[]) => mockGenerateRecommendations(...args),
}));

const { handleApiRequest } = await import('../../../src/main/ipc/api-router.js');

// モック用のリポジトリファクトリ
function createMockRepository() {
  return {
    findAllPaginated: vi.fn(),
    searchPaginated: vi.fn(),
    findById: vi.fn(),
    findByIdWithEmbedding: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    findByIdWithImages: vi.fn(),
    addImage: vi.fn(),
    removeImage: vi.fn(),
    findCollectionsByImageId: vi.fn(),
    findByImageId: vi.fn(),
    findRecent: vi.fn(),
    save: vi.fn(),
    deleteAll: vi.fn(),
    findByPrefix: vi.fn(),
    findRecentWithImages: vi.fn(),
    getOverview: vi.fn(),
    getViewTrends: vi.fn(),
    getPopularImages: vi.fn(),
    getRecommendationTrends: vi.fn(),
    listJobs: vi.fn(),
    getJob: vi.fn(),
    createImpressions: vi.fn(),
    findSimilar: vi.fn(),
    close: vi.fn(),
  };
}

// モック用の CoreContainer
function createMockContainer() {
  const imageRepo = createMockRepository();
  const labelRepo = createMockRepository();
  const collectionRepo = createMockRepository();
  const imageAttributeRepo = createMockRepository();
  const searchHistoryRepo = createMockRepository();
  const viewHistoryRepo = createMockRepository();
  const statsRepo = createMockRepository();
  const jobQueue = createMockRepository();
  const embeddingRepo = createMockRepository();
  const recommendationConversionRepo = createMockRepository();
  const fileStorage = {
    deleteFile: vi.fn(),
  };

  return {
    getImageRepository: () => imageRepo,
    getLabelRepository: () => labelRepo,
    getCollectionRepository: () => collectionRepo,
    getImageAttributeRepository: () => imageAttributeRepo,
    getSearchHistoryRepository: () => searchHistoryRepo,
    getViewHistoryRepository: () => viewHistoryRepo,
    getStatsRepository: () => statsRepo,
    getJobQueue: () => jobQueue,
    getEmbeddingRepository: () => embeddingRepo,
    getRecommendationConversionRepository: () => recommendationConversionRepo,
    getFileStorage: () => fileStorage,
    // 内部参照用
    _imageRepo: imageRepo,
    _labelRepo: labelRepo,
    _collectionRepo: collectionRepo,
    _imageAttributeRepo: imageAttributeRepo,
    _searchHistoryRepo: searchHistoryRepo,
    _viewHistoryRepo: viewHistoryRepo,
    _statsRepo: statsRepo,
    _jobQueue: jobQueue,
    _embeddingRepo: embeddingRepo,
    _recommendationConversionRepo: recommendationConversionRepo,
    _fileStorage: fileStorage,
  };
}

describe('handleApiRequest', () => {
  let container: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createMockContainer();
  });

  describe('Images API', () => {
    it('GET /api/images - 画像一覧を取得する', async () => {
      const mockResult = { items: [], total: 0, hasMore: false };
      container._imageRepo.findAllPaginated.mockResolvedValue(mockResult);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockResult);
      expect(container._imageRepo.findAllPaginated).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });
    });

    it('GET /api/images?limit=10&offset=20 - ページネーション付きで画像一覧を取得する', async () => {
      const mockResult = { items: [], total: 0, hasMore: false };
      container._imageRepo.findAllPaginated.mockResolvedValue(mockResult);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images?limit=10&offset=20',
      });

      expect(response.status).toBe(200);
      expect(container._imageRepo.findAllPaginated).toHaveBeenCalledWith({
        limit: 10,
        offset: 20,
      });
    });

    it('GET /api/images?q=test - 画像を検索する', async () => {
      const mockResult = { items: [], total: 0, hasMore: false };
      container._imageRepo.searchPaginated.mockResolvedValue(mockResult);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images?q=test',
      });

      expect(response.status).toBe(200);
      expect(container._imageRepo.searchPaginated).toHaveBeenCalledWith('test', {
        limit: 50,
        offset: 0,
      });
    });

    it('GET /api/images/:imageId - 画像詳細を取得する', async () => {
      const mockImage = { id: 'img-1', title: 'Test Image' };
      container._imageRepo.findById.mockResolvedValue(mockImage);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockImage);
    });

    it('GET /api/images/:imageId - 画像が見つからない場合は 404', async () => {
      container._imageRepo.findById.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/not-found',
      });

      expect(response.status).toBe(404);
      expect(response.error).toBe('Image not found');
    });

    it('PATCH /api/images/:imageId - 画像を更新する', async () => {
      const mockImage = { id: 'img-1', description: null };
      const updatedImage = { id: 'img-1', description: 'Updated' };
      container._imageRepo.findById.mockResolvedValue(mockImage);
      container._imageRepo.updateById.mockResolvedValue(updatedImage);

      const response = await handleApiRequest(container, {
        method: 'PATCH',
        url: '/api/images/img-1',
        body: { description: 'Updated' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedImage);
    });

    it('PATCH /api/images/:imageId - 画像が見つからない場合は 404', async () => {
      container._imageRepo.findById.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'PATCH',
        url: '/api/images/not-found',
        body: { description: 'Updated' },
      });

      expect(response.status).toBe(404);
      expect(response.error).toBe('Image not found');
    });

    it('DELETE /api/images/:imageId - 画像が見つからない場合は 404', async () => {
      container._imageRepo.findById.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/images/not-found',
      });

      expect(response.status).toBe(404);
      expect(response.error).toBe('Image not found');
    });

    it('DELETE /api/images/:imageId - サムネイルなしの画像を削除する', async () => {
      const mockImage = { id: 'img-1', path: 'storage/originals/test.jpg', thumbnailPath: null };
      container._imageRepo.findById.mockResolvedValue(mockImage);
      container._fileStorage.deleteFile.mockResolvedValue(undefined);
      container._imageRepo.deleteById.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/images/img-1',
      });

      expect(response.status).toBe(204);
      expect(container._fileStorage.deleteFile).toHaveBeenCalledTimes(1);
    });

    it('DELETE /api/images/:imageId - 画像を削除する', async () => {
      const mockImage = { id: 'img-1', path: 'storage/originals/test.jpg', thumbnailPath: 'storage/thumbnails/test.jpg' };
      container._imageRepo.findById.mockResolvedValue(mockImage);
      container._fileStorage.deleteFile.mockResolvedValue(undefined);
      container._imageRepo.deleteById.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/images/img-1',
      });

      expect(response.status).toBe(204);
      expect(container._fileStorage.deleteFile).toHaveBeenCalledWith(mockImage.path);
      expect(container._imageRepo.deleteById).toHaveBeenCalledWith('img-1');
    });

    // NOTE: /api/images/duplicates は /api/images/:imageId より後に登録されているため、
    // :imageId にマッチしてしまう。ルート順序の修正は別タスクで対応。
  });

  describe('Labels API', () => {
    it('GET /api/labels - ラベル一覧を取得する', async () => {
      const mockLabels = [{ id: 'lbl-1', name: 'Test' }];
      container._labelRepo.findAll.mockResolvedValue(mockLabels);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/labels',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockLabels);
    });

    it('POST /api/labels - ラベルを作成する', async () => {
      const mockLabel = { id: 'lbl-1', name: 'New Label' };
      container._labelRepo.create.mockResolvedValue(mockLabel);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/labels',
        body: { name: 'New Label' },
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockLabel);
    });

    it('PATCH /api/labels/:labelId - ラベルを更新する', async () => {
      const updatedLabel = { id: 'lbl-1', name: 'Updated' };
      container._labelRepo.updateById.mockResolvedValue(updatedLabel);

      const response = await handleApiRequest(container, {
        method: 'PATCH',
        url: '/api/labels/lbl-1',
        body: { name: 'Updated' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedLabel);
    });

    it('DELETE /api/labels/:labelId - ラベルを削除する', async () => {
      container._labelRepo.deleteById.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/labels/lbl-1',
      });

      expect(response.status).toBe(204);
    });
  });

  describe('Collections API', () => {
    it('GET /api/collections - コレクション一覧を取得する', async () => {
      const mockCollections = [{ id: 'col-1', name: 'Test' }];
      container._collectionRepo.findAll.mockResolvedValue(mockCollections);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/collections',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockCollections);
    });

    it('POST /api/collections - コレクションを作成する', async () => {
      const mockCollection = { id: 'col-1', name: 'New Collection' };
      container._collectionRepo.create.mockResolvedValue(mockCollection);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/collections',
        body: { name: 'New Collection' },
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockCollection);
    });

    it('GET /api/collections/:collectionId - コレクション詳細を取得する', async () => {
      const mockCollection = { id: 'col-1', name: 'Test', images: [] };
      container._collectionRepo.findByIdWithImages.mockResolvedValue(mockCollection);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/collections/col-1',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockCollection);
    });

    it('GET /api/collections/:collectionId - コレクションが見つからない場合は 404', async () => {
      container._collectionRepo.findByIdWithImages.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/collections/not-found',
      });

      expect(response.status).toBe(404);
    });

    it('POST /api/collections/:collectionId/images - コレクションに画像を追加する', async () => {
      container._collectionRepo.addImage.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/collections/col-1/images',
        body: { imageIds: ['img-1', 'img-2'] },
      });

      expect(response.status).toBe(204);
      expect(container._collectionRepo.addImage).toHaveBeenCalledTimes(2);
    });

    it('DELETE /api/collections/:collectionId/images - コレクションから画像を削除する', async () => {
      container._collectionRepo.removeImage.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/collections/col-1/images',
        body: { imageIds: ['img-1'] },
      });

      expect(response.status).toBe(204);
      expect(container._collectionRepo.removeImage).toHaveBeenCalledWith('col-1', 'img-1');
    });
  });

  describe('Search History API', () => {
    it('GET /api/search/history - 検索履歴を取得する', async () => {
      const mockHistory = [{ query: 'test' }];
      container._searchHistoryRepo.findRecent.mockResolvedValue(mockHistory);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/search/history',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockHistory);
    });

    it('POST /api/search/history - 検索履歴を保存する', async () => {
      container._searchHistoryRepo.save.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/search/history',
        body: { query: 'test query' },
      });

      expect(response.status).toBe(201);
    });

    it('DELETE /api/search/history - 検索履歴を削除する', async () => {
      container._searchHistoryRepo.deleteAll.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/search/history',
      });

      expect(response.status).toBe(204);
    });
  });

  describe('Jobs API', () => {
    it('GET /api/jobs - ジョブ一覧を取得する', async () => {
      const mockJobs = [{ id: 'job-1', status: 'active' }];
      container._jobQueue.listJobs.mockResolvedValue({ jobs: mockJobs });

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockJobs);
    });

    it('GET /api/jobs/:jobId - ジョブ詳細を取得する', async () => {
      const mockJob = { id: 'job-1', status: 'active' };
      container._jobQueue.getJob.mockResolvedValue(mockJob);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/jobs/job-1',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockJob);
    });

    it('GET /api/jobs/:jobId - ジョブが見つからない場合は 404', async () => {
      container._jobQueue.getJob.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/jobs/not-found',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Image Attributes API', () => {
    it('GET /api/images/:imageId/attributes - 画像の属性を取得する', async () => {
      const mockAttributes = [{ id: 'attr-1', labelId: 'lbl-1' }];
      container._imageAttributeRepo.findByImageId.mockResolvedValue(mockAttributes);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/attributes',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockAttributes);
    });

    it('POST /api/images/:imageId/attributes - 属性を作成する', async () => {
      const mockAttribute = { id: 'attr-1', imageId: 'img-1', labelId: 'lbl-1' };
      container._imageAttributeRepo.create.mockResolvedValue(mockAttribute);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/images/img-1/attributes',
        body: { labelId: 'lbl-1', keywords: 'test' },
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockAttribute);
    });

    it('PUT /api/images/:imageId/attributes/:attributeId - 属性を更新する', async () => {
      const updatedAttribute = { id: 'attr-1', keywords: 'updated' };
      container._imageAttributeRepo.updateById.mockResolvedValue(updatedAttribute);

      const response = await handleApiRequest(container, {
        method: 'PUT',
        url: '/api/images/img-1/attributes/attr-1',
        body: { keywords: 'updated' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedAttribute);
    });

    it('DELETE /api/images/:imageId/attributes/:attributeId - 属性を削除する', async () => {
      container._imageAttributeRepo.deleteById.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/images/img-1/attributes/attr-1',
      });

      expect(response.status).toBe(204);
    });
  });

  describe('View History API', () => {
    it('GET /api/view-history - 閲覧履歴を取得する', async () => {
      const mockHistory = [{ imageId: 'img-1', viewedAt: '2026-01-01' }];
      container._viewHistoryRepo.findRecentWithImages.mockResolvedValue(mockHistory);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/view-history',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockHistory);
    });

    it('GET /api/view-history?limit=10&offset=5 - パラメータ付きで閲覧履歴を取得する', async () => {
      const mockHistory = [{ imageId: 'img-1', viewedAt: '2026-01-01' }];
      container._viewHistoryRepo.findRecentWithImages.mockResolvedValue(mockHistory);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/view-history?limit=10&offset=5',
      });

      expect(response.status).toBe(200);
      expect(container._viewHistoryRepo.findRecentWithImages).toHaveBeenCalledWith({
        limit: 10,
        offset: 5,
      });
    });

    it('POST /api/view-history - 閲覧履歴を記録する', async () => {
      container._viewHistoryRepo.create.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/view-history',
        body: { imageId: 'img-1' },
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Stats API', () => {
    it('GET /api/stats/overview - 統計概要を取得する', async () => {
      const mockStats = { totalImages: 100, totalViews: 500 };
      container._statsRepo.getOverview.mockResolvedValue(mockStats);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/overview',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockStats);
    });

    it('GET /api/stats/overview?days=7 - days パラメータ付きで統計概要を取得する', async () => {
      const mockStats = { totalImages: 100, totalViews: 500 };
      container._statsRepo.getOverview.mockResolvedValue(mockStats);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/overview?days=7',
      });

      expect(response.status).toBe(200);
      expect(container._statsRepo.getOverview).toHaveBeenCalledWith({ days: 7 });
    });

    it('GET /api/stats/view-trends - 閲覧トレンドを取得する', async () => {
      const mockTrends = [{ date: '2026-01-01', count: 10 }];
      container._statsRepo.getViewTrends.mockResolvedValue(mockTrends);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/view-trends',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockTrends);
    });

    it('GET /api/stats/view-trends?days=14 - days パラメータ付きで閲覧トレンドを取得する', async () => {
      const mockTrends = [{ date: '2026-01-01', count: 10 }];
      container._statsRepo.getViewTrends.mockResolvedValue(mockTrends);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/view-trends?days=14',
      });

      expect(response.status).toBe(200);
      expect(container._statsRepo.getViewTrends).toHaveBeenCalledWith({ days: 14 });
    });

    it('GET /api/stats/popular-images - 人気画像を取得する', async () => {
      const mockImages = [{ id: 'img-1', views: 100 }];
      container._statsRepo.getPopularImages.mockResolvedValue(mockImages);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/popular-images',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockImages);
    });

    it('GET /api/stats/popular-images?limit=5&days=7 - パラメータ付きで人気画像を取得する', async () => {
      const mockImages = [{ id: 'img-1', views: 100 }];
      container._statsRepo.getPopularImages.mockResolvedValue(mockImages);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/popular-images?limit=5&days=7',
      });

      expect(response.status).toBe(200);
      expect(container._statsRepo.getPopularImages).toHaveBeenCalledWith({ limit: 5, days: 7 });
    });

    it('GET /api/stats/recommendation-trends - レコメンドトレンドを取得する', async () => {
      const mockTrends = [{ date: '2026-01-01', impressions: 50 }];
      container._statsRepo.getRecommendationTrends.mockResolvedValue(mockTrends);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/recommendation-trends',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockTrends);
    });

    it('GET /api/stats/recommendation-trends?days=60 - days パラメータ付きでレコメンドトレンドを取得する', async () => {
      const mockTrends = [{ date: '2026-01-01', impressions: 50 }];
      container._statsRepo.getRecommendationTrends.mockResolvedValue(mockTrends);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/stats/recommendation-trends?days=60',
      });

      expect(response.status).toBe(200);
      expect(container._statsRepo.getRecommendationTrends).toHaveBeenCalledWith({ days: 60 });
    });
  });

  describe('Recommendations API', () => {
    it('GET /api/recommendations - レコメンドを取得する', async () => {
      const mockResult = { images: [] };
      mockGenerateRecommendations.mockResolvedValue(mockResult);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/recommendations',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockResult);
    });

    it('GET /api/recommendations?limit=10 - limit パラメータ付きでレコメンドを取得する', async () => {
      const mockResult = { images: [] };
      mockGenerateRecommendations.mockResolvedValue(mockResult);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/recommendations?limit=10',
      });

      expect(response.status).toBe(200);
      expect(mockGenerateRecommendations).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        { limit: 10 },
      );
    });

    it('POST /api/recommendations/conversions - コンバージョンを記録する', async () => {
      container._recommendationConversionRepo.createImpressions.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/recommendations/conversions',
        body: { impressions: [{ imageId: 'img-1', score: 0.9 }] },
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Collections Extended API', () => {
    it('PATCH /api/collections/:collectionId - コレクションを更新する', async () => {
      const updatedCollection = { id: 'col-1', name: 'Updated' };
      container._collectionRepo.updateById.mockResolvedValue(updatedCollection);

      const response = await handleApiRequest(container, {
        method: 'PATCH',
        url: '/api/collections/col-1',
        body: { name: 'Updated' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedCollection);
    });

    it('DELETE /api/collections/:collectionId - コレクションを削除する', async () => {
      container._collectionRepo.deleteById.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'DELETE',
        url: '/api/collections/col-1',
      });

      expect(response.status).toBe(204);
    });

    it('GET /api/collections/:collectionId/images - コレクションの画像一覧を取得する', async () => {
      const mockCollection = { id: 'col-1', images: [{ id: 'img-1' }] };
      container._collectionRepo.findByIdWithImages.mockResolvedValue(mockCollection);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/collections/col-1/images',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockCollection.images);
    });

    it('GET /api/collections/:collectionId/images - コレクションが見つからない場合は 404', async () => {
      container._collectionRepo.findByIdWithImages.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/collections/not-found/images',
      });

      expect(response.status).toBe(404);
    });

    it('GET /api/images/:imageId/collections - 画像が属するコレクション一覧を取得する', async () => {
      const mockCollections = [{ id: 'col-1', name: 'Test' }];
      container._collectionRepo.findCollectionsByImageId.mockResolvedValue(mockCollections);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/collections',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockCollections);
    });
  });

  describe('Search Suggestions API', () => {
    it('GET /api/search/suggestions - 検索サジェストを取得する', async () => {
      const mockSuggestions = ['test1', 'test2'];
      container._searchHistoryRepo.findByPrefix.mockResolvedValue(mockSuggestions);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/search/suggestions?q=test',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockSuggestions);
    });
  });

  describe('Similar Images API', () => {
    it('GET /api/images/:imageId/similar - 類似画像を取得する（埋め込みなし）', async () => {
      container._imageRepo.findByIdWithEmbedding.mockResolvedValue({ embedding: null });

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/similar',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ imageId: 'img-1', similarImages: [] });
    });

    it('GET /api/images/:imageId/similar - 類似画像を取得する（画像が undefined）', async () => {
      container._imageRepo.findByIdWithEmbedding.mockResolvedValue(undefined);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/similar',
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ imageId: 'img-1', similarImages: [] });
    });

    it('GET /api/images/:imageId/similar - 類似画像を取得する（埋め込みあり）', async () => {
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      const buffer = embedding.buffer;
      container._imageRepo.findByIdWithEmbedding.mockResolvedValue({
        embedding: { buffer, byteOffset: 0, byteLength: buffer.byteLength },
      });
      container._embeddingRepo.findSimilar.mockReturnValue([
        { imageId: 'img-2', distance: 0.1 },
      ]);
      container._imageRepo.findById.mockResolvedValue({
        id: 'img-2',
        title: 'Similar',
        thumbnailPath: 'thumb.jpg',
      });

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/similar',
      });

      expect(response.status).toBe(200);
      expect(response.data.imageId).toBe('img-1');
      expect(response.data.similarImages).toHaveLength(1);
    });

    it('GET /api/images/:imageId/similar?limit=5 - limit パラメータ付きで類似画像を取得する', async () => {
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      const buffer = embedding.buffer;
      container._imageRepo.findByIdWithEmbedding.mockResolvedValue({
        embedding: { buffer, byteOffset: 0, byteLength: buffer.byteLength },
      });
      container._embeddingRepo.findSimilar.mockReturnValue([]);
      container._imageRepo.findById.mockResolvedValue(null);

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/similar?limit=5',
      });

      expect(response.status).toBe(200);
      expect(container._embeddingRepo.findSimilar).toHaveBeenCalledWith(
        expect.any(Float32Array),
        6, // limit + 1
        ['img-1'],
      );
    });

    it('GET /api/images/:imageId/similar - 類似画像が見つからない場合はフィルタリングされる', async () => {
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      const buffer = embedding.buffer;
      container._imageRepo.findByIdWithEmbedding.mockResolvedValue({
        embedding: { buffer, byteOffset: 0, byteLength: buffer.byteLength },
      });
      container._embeddingRepo.findSimilar.mockReturnValue([
        { imageId: 'img-2', distance: 0.1 },
      ]);
      container._imageRepo.findById.mockResolvedValue(null); // 画像が見つからない

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images/img-1/similar',
      });

      expect(response.status).toBe(200);
      expect(response.data.similarImages).toHaveLength(0); // フィルタリングされる
    });
  });

  describe('Error Handling', () => {
    it('未知のルートは 404 を返す', async () => {
      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/unknown',
      });

      expect(response.status).toBe(404);
      expect(response.error).toBe('Not found');
    });

    it('ハンドラがエラーを投げた場合は 500 を返す', async () => {
      container._imageRepo.findAllPaginated.mockRejectedValue(new Error('DB error'));

      const response = await handleApiRequest(container, {
        method: 'GET',
        url: '/api/images',
      });

      expect(response.status).toBe(500);
      expect(response.error).toBe('DB error');
    });
  });

  describe('POST /api/images/from-local', () => {
    it('ローカル画像を正常に登録する', async () => {
      const mockImage = { id: 'img-1' };
      container._imageRepo.create.mockResolvedValue(mockImage);

      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/images/from-local',
        body: {
          path: 'storage/originals/test.jpg',
          thumbnailPath: 'storage/thumbnails/test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          width: 800,
          height: 600,
        },
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockImage);
    });

    it('無効なリクエストボディは 400 を返す', async () => {
      const response = await handleApiRequest(container, {
        method: 'POST',
        url: '/api/images/from-local',
        body: { path: '' }, // 不完全なボディ
      });

      expect(response.status).toBe(400);
      expect(response.error).toBe('Invalid request body');
    });
  });
});
