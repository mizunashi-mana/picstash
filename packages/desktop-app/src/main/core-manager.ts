/**
 * @picstash/core ライフサイクル管理のシングルトン。
 * CoreContainer の初期化・破棄・取得を一元管理する。
 *
 * NOTE: @picstash/core は重量級の依存（transformers, tesseract.js 等）を含むため、
 * 静的インポートではなく initialize() 内で動的インポートし、起動時間を短縮する。
 */

import { join } from 'node:path';
import { runMigrations } from './migration-runner.js';
import type { CoreContainer } from '@picstash/core';

/**
 * Core ライフサイクルマネージャー
 */
class CoreManager {
  private container: CoreContainer | null = null;

  /** initialize/teardown の直列化用 Promise チェーン */
  private pending: Promise<void> = Promise.resolve();

  /**
   * 排他制御付きで操作を直列実行する。
   * IPC 経由の短時間連続発火でもレースコンディションを防ぐ。
   */
  private async enqueue(fn: () => Promise<void>): Promise<void> {
    this.pending = this.pending.then(fn, fn);
    await this.pending;
  }

  /**
   * @picstash/core を初期化する。
   * CoreConfig を構築 → マイグレーション実行 → コンテナ構築 → DB 接続。
   *
   * @param storagePath - ユーザーが選択したストレージディレクトリの絶対パス
   */
  async initialize(storagePath: string): Promise<void> {
    await this.enqueue(async () => {
      await this.doInitialize(storagePath);
    });
  }

  private async doInitialize(storagePath: string): Promise<void> {
    // 重量級の依存を遅延ロード（起動時間を短縮するため）
    await import('reflect-metadata');
    const { buildCoreContainer } = await import('@picstash/core');

    const dbPath = join(storagePath, 'picstash.db');

    const config = {
      database: { path: dbPath },
      storage: { path: storagePath },
      logging: {
        level: 'info' as const,
        format: 'pretty' as const,
        file: {
          enabled: false,
          path: join(storagePath, 'logs', 'picstash.log'),
          rotation: { enabled: false, maxSize: '10M', maxFiles: 5 },
        },
      },
    };

    // マイグレーションを実行（コンテナ構築前に DB スキーマを確定させる）
    await runMigrations(dbPath);

    // DI コンテナを構築
    const container = buildCoreContainer(config);

    // データベースに接続
    await container.getDatabaseService().connect();

    this.container = container;
  }

  /**
   * @picstash/core のリソースを解放する。
   * DB 切断 → EmbeddingRepository クローズ → コンテナ破棄。
   */
  async teardown(): Promise<void> {
    await this.enqueue(async () => {
      await this.doTeardown();
    });
  }

  private async doTeardown(): Promise<void> {
    if (this.container === null) {
      return;
    }

    const container = this.container;
    this.container = null;

    try {
      await container.getDatabaseService().disconnect();
    }
    catch {
      // 切断エラーは無視（アプリ終了時に発生しうる）
    }

    try {
      container.getEmbeddingRepository().close();
    }
    catch {
      // クローズエラーは無視
    }
  }

  /**
   * CoreContainer を返す。未初期化なら例外を投げる。
   */
  getContainer(): CoreContainer {
    if (this.container === null) {
      throw new Error('CoreManager is not initialized. Call initialize() first.');
    }
    return this.container;
  }

  /**
   * 初期化済みかどうかを返す。
   */
  isInitialized(): boolean {
    return this.container !== null;
  }
}

// シングルトンインスタンス
export const coreManager = new CoreManager();
