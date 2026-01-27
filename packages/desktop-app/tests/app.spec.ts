import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..');

// npm ワークスペースの node_modules 配置により、Playwright が electron バイナリを自動検出できないため
// テストファイルのコンテキストから明示的にパスを解決する
const nodeRequire = createRequire(import.meta.url);
const electronBinaryPath: string = nodeRequire('electron');

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // Electron アプリをビルドしてから起動
  // CI 環境では --no-sandbox フラグが必要（Linux の SUID サンドボックス権限問題を回避）
  const args = [appPath];
  if (process.env.CI !== undefined) {
    args.push('--no-sandbox');
  }
  electronApp = await electron.launch({
    args,
    executablePath: electronBinaryPath,
  });

  // 最初のウィンドウを取得
  window = await electronApp.firstWindow();

  // ウィンドウが読み込まれるのを待つ
  await window.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Electron アプリの起動', () => {
  test('ウィンドウが表示される', async () => {
    const title = await window.title();
    expect(title).toBe('Picstash');
  });

  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions -- Playwright の ElectronType がモノレポのルート node_modules から electron モジュールを解決できないため evaluate() の戻り値型が error 型になる */
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
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions */
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
});
