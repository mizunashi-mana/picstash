/**
 * @picstash/core ライフサイクル管理のシングルトン。
 * CoreContainer の初期化・破棄・取得を一元管理する。
 */

import 'reflect-metadata';
import { join } from 'node:path';
import { buildCoreContainer } from '@picstash/core';
import { runMigrations } from './migration-runner.js';
import type { CoreConfig, CoreContainer } from '@picstash/core';

/**
 * Core ライフサイクルマネージャー
 */
class CoreManager {
  private container: CoreContainer | null = null;

  /**
   * @picstash/core を初期化する。
   * CoreConfig を構築 → マイグレーション実行 → コンテナ構築 → DB 接続。
   *
   * @param storagePath - ユーザーが選択したストレージディレクトリの絶対パス
   */
  async initialize(storagePath: string): Promise<void> {
    const dbPath = join(storagePath, 'picstash.db');

    const config: CoreConfig = {
      database: { path: dbPath },
      storage: { path: storagePath },
      logging: {
        level: 'info',
        format: 'pretty',
        file: {
          enabled: false,
          path: '',
          rotation: { enabled: false, maxSize: '10M', maxFiles: 5 },
        },
      },
    };

    // マイグレーションを実行（コンテナ構築前に DB スキーマを確定させる）
    await runMigrations(dbPath);

    // DI コンテナを構築
    const container = buildCoreContainer(config);

    // データベースに接続
    await container.getPrismaService().connect();

    this.container = container;
  }

  /**
   * @picstash/core のリソースを解放する。
   * DB 切断 → EmbeddingRepository クローズ → コンテナ破棄。
   */
  async teardown(): Promise<void> {
    if (this.container === null) {
      return;
    }

    const container = this.container;
    this.container = null;

    try {
      await container.getPrismaService().disconnect();
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
