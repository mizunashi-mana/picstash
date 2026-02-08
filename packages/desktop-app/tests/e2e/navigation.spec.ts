import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { setupStorageIfNeeded } from './helpers.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..', '..');

// E2E テスト用のデータディレクトリ
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-navigation-data');
// ストレージ用ディレクトリ（e2eDataDir 内に作成）
const storageDir = path.join(e2eDataDir, 'storage');

const nodeRequire = createRequire(import.meta.url);
const electronBinaryPath: string = nodeRequire('electron');

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  await rm(e2eDataDir, { recursive: true, force: true });

  // CI環境では前のElectronプロセスのクリーンアップを待つ
  if (process.env.CI !== undefined) {
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const args = [appPath];
  if (process.env.CI !== undefined) {
    args.push('--no-sandbox');
    args.push('--disable-gpu');
    args.push('--disable-dev-shm-usage');
  }
  electronApp = await electron.launch({
    args,
    executablePath: electronBinaryPath,
    env: {
      ...process.env,
      PICSTASH_E2E_DATA_DIR: e2eDataDir,
    },
  });

  window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // ストレージが未設定の場合は設定する
  await setupStorageIfNeeded(window, storageDir);

  // アプリが完全に読み込まれるまで待機（サイドバーのリンクが表示されるまで）
  await expect(window.getByRole('link', { name: 'ホーム' })).toBeVisible();
});

test.afterAll(async () => {
  await electronApp.close();
  await rm(e2eDataDir, { recursive: true, force: true });
});

test.describe('サイドバーナビゲーション', () => {
  test('ホームページに遷移できる', async () => {
    await window.getByRole('link', { name: 'ホーム' }).click();
    await expect(window.getByRole('heading', { name: 'Picstash', level: 1 })).toBeVisible();
  });

  test('ギャラリーページに遷移できる', async () => {
    await window.getByRole('link', { name: 'ギャラリー' }).click();
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });

  test('コレクションページに遷移できる', async () => {
    await window.getByRole('link', { name: 'コレクション', exact: true }).click();
    await expect(window.getByRole('heading', { name: 'コレクション', level: 2 })).toBeVisible();
  });

  test('ラベルページに遷移できる', async () => {
    await window.getByRole('link', { name: 'ラベル' }).click();
    await expect(window.getByRole('heading', { name: 'ラベル管理', level: 2 })).toBeVisible();
  });

  test('重複検出ページに遷移できる', async () => {
    await window.getByRole('link', { name: '重複検出' }).click();
    // 重複検出ページはエラーまたは空の状態を表示する可能性がある
    // ナビゲーションリンクがアクティブになることで遷移を確認
    await expect(window.getByRole('link', { name: '重複検出' })).toHaveAttribute('data-active', 'true');
  });

  test('インポートページに遷移できる', async () => {
    await window.getByRole('link', { name: 'インポート' }).click();
    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
  });

  test('統計ページに遷移できる', async () => {
    await window.getByRole('link', { name: '統計' }).click();
    await expect(window.getByRole('heading', { name: '統計ダッシュボード', level: 2 })).toBeVisible();
  });

  test('設定ページに遷移できる', async () => {
    await window.getByRole('link', { name: '設定' }).click();
    await expect(window.getByRole('heading', { name: '設定', level: 2 })).toBeVisible();
  });
});

test.describe('ナビゲーションリンクのアクティブ状態', () => {
  test('現在のページのリンクがアクティブになる', async () => {
    await window.getByRole('link', { name: 'ギャラリー' }).click();
    // data-active 属性でアクティブ状態を確認
    const galleryLink = window.getByRole('link', { name: 'ギャラリー' });
    await expect(galleryLink).toHaveAttribute('data-active', 'true');

    await window.getByRole('link', { name: 'ラベル' }).click();
    const labelsLink = window.getByRole('link', { name: 'ラベル' });
    await expect(labelsLink).toHaveAttribute('data-active', 'true');
  });
});

test.describe('サイドバーの折りたたみ', () => {
  test('サイドバーを折りたたんで展開できる', async () => {
    const collapseButton = window.getByRole('button', { name: 'サイドバーを折りたたむ' });
    await expect(collapseButton).toBeVisible();

    // 折りたたみ前はナビゲーションテキストが見える
    await expect(window.getByText('ホーム')).toBeVisible();

    // 折りたたむ
    await collapseButton.click();

    // 展開ボタンが表示される（「サイドバーを展開」というラベル）
    const expandButton = window.getByRole('button', { name: 'サイドバーを展開' });
    await expect(expandButton).toBeVisible();

    // 展開する
    await expandButton.click();

    // 折りたたみボタンが再度表示される
    await expect(collapseButton).toBeVisible();
  });
});
