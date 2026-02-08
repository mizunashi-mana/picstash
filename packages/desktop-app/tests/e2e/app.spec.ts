import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..', '..');

// E2E テスト用のデータディレクトリ（本番データを汚染しないようテスト専用パスを使用）
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-data');

// npm ワークスペースの node_modules 配置により、Playwright が electron バイナリを自動検出できないため
// テストファイルのコンテキストから明示的にパスを解決する
const nodeRequire = createRequire(import.meta.url);
const electronBinaryPath: string = nodeRequire('electron');

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // 前回のテストデータをクリーンアップ（存在しない場合も無視）
  await rm(e2eDataDir, { recursive: true, force: true });

  // Electron アプリをビルドしてから起動
  // CI 環境では --no-sandbox フラグが必要（Linux の SUID サンドボックス権限問題を回避）
  const args = [appPath];
  if (process.env.CI !== undefined) {
    args.push('--no-sandbox');
  }
  electronApp = await electron.launch({
    args,
    executablePath: electronBinaryPath,
    env: {
      ...process.env,
      // E2E テスト用のデータディレクトリを設定（本番データを汚染しない）
      PICSTASH_E2E_DATA_DIR: e2eDataDir,
    },
  });

  // 最初のウィンドウを取得
  window = await electronApp.firstWindow();

  // ウィンドウが読み込まれるのを待つ
  await window.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();

  // テストデータをクリーンアップ
  await rm(e2eDataDir, { recursive: true, force: true });
});

test.describe('Electron アプリの起動', () => {
  test('ウィンドウが表示される', async () => {
    const title = await window.title();
    expect(title).toBe('Picstash');
  });

  test('ウィンドウサイズが正しい', async () => {
    const windowSize = await electronApp.evaluate(({ BrowserWindow }) => {
      const [mainWindow] = BrowserWindow.getAllWindows();
      const bounds = mainWindow?.getBounds();
      return bounds ? { width: bounds.width, height: bounds.height } : null;
    });

    expect(windowSize).not.toBeNull();
    expect(windowSize?.width).toBeGreaterThanOrEqual(1200);
    expect(windowSize?.height).toBeGreaterThanOrEqual(800);
  });

  test('アプリ名が正しい', async () => {
    const appName = await electronApp.evaluate(({ app }) => app.getName());
    expect(appName).toBe('@picstash/desktop-app');
  });
});

test.describe('プリロードスクリプト', () => {
  test('picstash API がウィンドウに公開されている', async () => {
    const hasPicstashApi = await window.evaluate(() => {
      return 'picstash' in window;
    });
    expect(hasPicstashApi).toBe(true);
  });

  test('バージョン情報が取得できる', async () => {
    interface PicstashWindow {
      picstash?: {
        versions: {
          node: string;
          chrome: string;
          electron: string;
        };
      };
    }
    const versions = await window.evaluate(() => {
      const win = window as unknown as PicstashWindow;
      return win.picstash?.versions;
    });

    expect(versions?.node).toBeTruthy();
    expect(versions?.chrome).toBeTruthy();
    expect(versions?.electron).toBeTruthy();
  });

  test('Storage API が公開されている', async () => {
    interface PicstashWindow {
      picstash?: {
        storage: {
          readFile: unknown;
          saveFile: unknown;
          deleteFile: unknown;
          fileExists: unknown;
          getFileSize: unknown;
          getPath: unknown;
          setPath: unknown;
          selectPath: unknown;
          isInitialized: unknown;
        };
      };
    }
    const storageApi = await window.evaluate(() => {
      const win = window as unknown as PicstashWindow;
      const storage = win.picstash?.storage;
      if (storage === undefined) {
        return null;
      }
      return {
        hasReadFile: typeof storage.readFile === 'function',
        hasSaveFile: typeof storage.saveFile === 'function',
        hasDeleteFile: typeof storage.deleteFile === 'function',
        hasFileExists: typeof storage.fileExists === 'function',
        hasGetFileSize: typeof storage.getFileSize === 'function',
        hasGetPath: typeof storage.getPath === 'function',
        hasSetPath: typeof storage.setPath === 'function',
        hasSelectPath: typeof storage.selectPath === 'function',
        hasIsInitialized: typeof storage.isInitialized === 'function',
      };
    });

    expect(storageApi).not.toBeNull();
    expect(storageApi?.hasReadFile).toBe(true);
    expect(storageApi?.hasSaveFile).toBe(true);
    expect(storageApi?.hasDeleteFile).toBe(true);
    expect(storageApi?.hasFileExists).toBe(true);
    expect(storageApi?.hasGetFileSize).toBe(true);
    expect(storageApi?.hasGetPath).toBe(true);
    expect(storageApi?.hasSetPath).toBe(true);
    expect(storageApi?.hasSelectPath).toBe(true);
    expect(storageApi?.hasIsInitialized).toBe(true);
  });
});

test.describe('セキュリティ設定', () => {
  test('Node.js API がレンダラーで直接利用できない', async () => {
    const hasProcess = await window.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ブラウザ環境では process が未定義のためチェックが必要
      return typeof process !== 'undefined' && process.versions !== undefined;
    });
    // contextIsolation が有効なので、process は undefined であるべき
    expect(hasProcess).toBe(false);
  });

  test('require が利用できない', async () => {
    const hasRequire = await window.evaluate(() => {
      return typeof require !== 'undefined';
    });
    expect(hasRequire).toBe(false);
  });
});

test.describe('UI 表示', () => {
  test('React アプリが読み込まれる', async () => {
    // React アプリのルート要素が存在することを確認
    await expect(window.locator('#root')).toBeVisible();
    // root の子要素が存在する（React がマウントされている）まで待つ
    await expect.poll(async () => await window.locator('#root > *').count()).toBeGreaterThan(0);
  });

  test('アプリケーションが起動する', async () => {
    // ストレージ設定状態に関わらず、アプリケーションが正常に起動することを確認
    // ストレージ未設定の場合は選択画面、設定済みの場合はメイン画面が表示される
    const selectButton = window.getByRole('button', { name: 'フォルダを選択' });
    const homeLink = window.getByRole('link', { name: 'ホーム' });

    // どちらかが表示されていれば OK
    const isStorageSetupVisible = await selectButton.isVisible().catch(() => false);
    const isMainAppVisible = await homeLink.isVisible().catch(() => false);

    expect(isStorageSetupVisible || isMainAppVisible).toBe(true);
  });
});
