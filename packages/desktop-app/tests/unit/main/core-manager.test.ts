import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック: migration-runner
const mockRunMigrations = vi.fn<(dbPath: string) => Promise<number>>().mockResolvedValue(0);
vi.mock('../../../src/main/migration-runner.js', () => ({
  runMigrations: async (dbPath: string) => await mockRunMigrations(dbPath),
}));

// モック: @picstash/core
const mockConnect = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockDisconnect = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockClose = vi.fn();

const mockDatabaseService = {
  connect: mockConnect,
  disconnect: mockDisconnect,
};

const mockEmbeddingRepository = {
  close: mockClose,
};

const mockContainer = {
  getDatabaseService: () => mockDatabaseService,
  getEmbeddingRepository: () => mockEmbeddingRepository,
};

const mockBuildCoreContainer = vi.fn().mockReturnValue(mockContainer);

vi.mock('reflect-metadata', () => ({}));
vi.mock('@picstash/core', () => ({

  buildCoreContainer: (...args: unknown[]) => mockBuildCoreContainer(...args),
}));

// テスト対象をモック設定後に動的インポート
// coreManager はシングルトンなので、各テストで新しいインスタンスが必要
// テスト間の分離のため、毎回 import し直す代わりにクラスをインポート
const mod = await import('../../../src/main/core-manager.js');

describe('CoreManager', () => {
  // シングルトンを使うが、テスト間で状態をリセットする
  const { coreManager } = mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 前のテストの状態をクリア
    await coreManager.teardown();
    vi.clearAllMocks(); // teardown の呼び出し記録もクリア
  });

  describe('initialize', () => {
    it('CoreConfig を正しく構築してコンテナを初期化する', async () => {
      await coreManager.initialize('/test/storage');

      expect(mockRunMigrations).toHaveBeenCalledWith('/test/storage/picstash.db');
      expect(mockBuildCoreContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          database: { path: '/test/storage/picstash.db' },
          storage: { path: '/test/storage' },
          logging: expect.objectContaining({
            level: 'info',
            format: 'pretty',
            file: expect.objectContaining({ enabled: false }),
          }),
        }),
      );
      expect(mockConnect).toHaveBeenCalled();
    });

    it('初期化後 isInitialized が true を返す', async () => {
      expect(coreManager.isInitialized()).toBe(false);
      await coreManager.initialize('/test/storage');
      expect(coreManager.isInitialized()).toBe(true);
    });

    it('マイグレーションがコンテナ構築前に実行される', async () => {
      const callOrder: string[] = [];
      mockRunMigrations.mockImplementation(async () => {
        callOrder.push('runMigrations');
        return 0;
      });
      mockBuildCoreContainer.mockImplementation((..._args: unknown[]) => {
        callOrder.push('buildCoreContainer');
        return mockContainer;
      });

      await coreManager.initialize('/test/storage');

      expect(callOrder).toEqual(['runMigrations', 'buildCoreContainer']);
    });
  });

  describe('teardown', () => {
    it('初期化済みの場合、DB 切断と EmbeddingRepository クローズが呼ばれる', async () => {
      await coreManager.initialize('/test/storage');
      await coreManager.teardown();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
      expect(coreManager.isInitialized()).toBe(false);
    });

    it('未初期化の場合は何もしない', async () => {
      await coreManager.teardown();

      expect(mockDisconnect).not.toHaveBeenCalled();
      expect(mockClose).not.toHaveBeenCalled();
    });

    it('disconnect がエラーを投げてもクローズ処理を続行する', async () => {
      mockDisconnect.mockRejectedValueOnce(new Error('disconnect failed'));

      await coreManager.initialize('/test/storage');
      // エラーが投げられないことを確認
      await expect(coreManager.teardown()).resolves.toBeUndefined();

      expect(mockClose).toHaveBeenCalled();
      expect(coreManager.isInitialized()).toBe(false);
    });

    it('close がエラーを投げても正常に完了する', async () => {
      mockClose.mockImplementationOnce(() => {
        throw new Error('close failed');
      });

      await coreManager.initialize('/test/storage');
      await expect(coreManager.teardown()).resolves.toBeUndefined();
      expect(coreManager.isInitialized()).toBe(false);
    });
  });

  describe('getContainer', () => {
    it('初期化後はコンテナを返す', async () => {
      await coreManager.initialize('/test/storage');
      const container = coreManager.getContainer();
      expect(container).toBe(mockContainer);
    });

    it('未初期化の場合は例外を投げる', () => {
      expect(() => coreManager.getContainer()).toThrow(
        'CoreManager is not initialized. Call initialize() first.',
      );
    });

    it('teardown 後は例外を投げる', async () => {
      await coreManager.initialize('/test/storage');
      await coreManager.teardown();
      expect(() => coreManager.getContainer()).toThrow(
        'CoreManager is not initialized. Call initialize() first.',
      );
    });
  });

  describe('isInitialized', () => {
    it('初期状態では false を返す', () => {
      expect(coreManager.isInitialized()).toBe(false);
    });

    it('initialize 後は true を返す', async () => {
      await coreManager.initialize('/test/storage');
      expect(coreManager.isInitialized()).toBe(true);
    });

    it('teardown 後は false を返す', async () => {
      await coreManager.initialize('/test/storage');
      await coreManager.teardown();
      expect(coreManager.isInitialized()).toBe(false);
    });
  });
});
