import { mkdir } from 'node:fs/promises';
import type { Page } from '@playwright/test';

// Electron ウィンドウの picstash API の型定義
interface PicstashWindow {
  picstash?: {
    storage: {
      isInitialized: () => Promise<boolean>;
      setPath: (path: string) => Promise<void>;
    };
  };
}

/**
 * ストレージが初期化されていない場合、プログラム的にストレージを設定する
 * @param window Playwright ページオブジェクト
 * @param storagePath ストレージディレクトリのパス
 */
export async function setupStorageIfNeeded(window: Page, storagePath: string): Promise<void> {
  // ストレージディレクトリを作成（存在しない場合）
  await mkdir(storagePath, { recursive: true });

  // ストレージが初期化されているかチェック
  const isInitialized = await window.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Electron ウィンドウの型をテスト用に明示
    const win = window as unknown as PicstashWindow;
    if (win.picstash === undefined) {
      return false;
    }
    return await win.picstash.storage.isInitialized();
  });

  if (isInitialized) {
    return;
  }

  // ストレージパスをプログラム的に設定
  await window.evaluate(async (path: string) => {
    interface PicstashWindowInner {
      picstash?: {
        storage: {
          setPath: (path: string) => Promise<void>;
        };
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Electron ウィンドウの型をテスト用に明示
    const win = window as unknown as PicstashWindowInner;
    if (win.picstash === undefined) {
      throw new Error('picstash API is not available');
    }
    await win.picstash.storage.setPath(path);
  }, storagePath);

  // ページをリロードして React コンポーネントを再マウント
  await window.reload();
  await window.waitForLoadState('domcontentloaded');
}
