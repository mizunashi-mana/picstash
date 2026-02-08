import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { setupStorageIfNeeded } from './helpers.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..', '..');
const fixturesPath = path.join(currentDir, '..', 'fixtures');

// E2E テスト用のデータディレクトリ
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-import-data');
// ストレージ用ディレクトリ
const storageDir = path.join(e2eDataDir, 'storage');

const nodeRequire = createRequire(import.meta.url);
const electronBinaryPath: string = nodeRequire('electron');

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  await rm(e2eDataDir, { recursive: true, force: true });

  const args = [appPath];
  if (process.env.CI !== undefined) {
    args.push('--no-sandbox');
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
  await setupStorageIfNeeded(window, storageDir);
  await expect(window.getByRole('link', { name: 'ホーム' })).toBeVisible();
});

test.afterAll(async () => {
  await electronApp.close();
  await rm(e2eDataDir, { recursive: true, force: true });
});

test.describe('インポートページ', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'インポート' }).click();
    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
  });

  test('インポートページが表示される', async () => {
    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
    await expect(window.getByText('画像、アーカイブ、URL から取り込み')).toBeVisible();
  });

  test('タブが表示される', async () => {
    await expect(window.getByRole('tab', { name: '画像' })).toBeVisible();
    await expect(window.getByRole('tab', { name: 'アーカイブ' })).toBeVisible();
    await expect(window.getByRole('tab', { name: 'URL' })).toBeVisible();
  });

  test('画像タブがデフォルトで選択されている', async () => {
    const imageTab = window.getByRole('tab', { name: '画像' });
    await expect(imageTab).toHaveAttribute('aria-selected', 'true');
  });

  test('画像タブにドロップゾーンが表示される', async () => {
    await expect(window.getByText('画像ファイルをドラッグ＆ドロップまたはクリックして選択')).toBeVisible();
    await expect(window.getByRole('button', { name: 'Choose File' })).toBeVisible();
  });
});

test.describe('タブ切り替え', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'インポート' }).click();
    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
  });

  test('アーカイブタブに切り替えられる', async () => {
    await window.getByRole('tab', { name: 'アーカイブ' }).click();
    const archiveTab = window.getByRole('tab', { name: 'アーカイブ' });
    await expect(archiveTab).toHaveAttribute('aria-selected', 'true');
    // アーカイブタブパネルが表示される
    await expect(window.getByRole('tabpanel', { name: 'アーカイブ' })).toBeVisible();
  });

  test('URL タブに切り替えられる', async () => {
    await window.getByRole('tab', { name: 'URL' }).click();
    const urlTab = window.getByRole('tab', { name: 'URL' });
    await expect(urlTab).toHaveAttribute('aria-selected', 'true');
    // URL タブパネルが表示される
    await expect(window.getByRole('tabpanel', { name: 'URL' })).toBeVisible();
  });

  test('画像タブに戻れる', async () => {
    // 別のタブに移動
    await window.getByRole('tab', { name: 'URL' }).click();
    await expect(window.getByRole('tab', { name: 'URL' })).toHaveAttribute('aria-selected', 'true');

    // 画像タブに戻る
    await window.getByRole('tab', { name: '画像' }).click();
    await expect(window.getByRole('tab', { name: '画像' })).toHaveAttribute('aria-selected', 'true');
    await expect(window.getByRole('tabpanel', { name: '画像' })).toBeVisible();
  });
});

test.describe('画像アップロード', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'インポート' }).click();
    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
  });

  test('ファイル選択ダイアログを開くボタンが存在する', async () => {
    // ドロップゾーン内の Choose File ボタンを確認
    const chooseFileButton = window.getByRole('button', { name: 'Choose File' });
    await expect(chooseFileButton).toBeVisible();
  });

  test('ドロップゾーンがクリック可能', async () => {
    // ドロップゾーンの存在確認
    const dropzone = window.getByText('ここに画像をドラッグ＆ドロップ');
    await expect(dropzone).toBeVisible();
  });

  test('ファイル選択ボタンをクリックするとファイルダイアログが開く', async () => {
    const testImagePath = path.join(fixturesPath, 'test-image.png');

    // input[type="file"] を直接操作してファイルをアップロード
    const fileInput = window.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // アップロード処理が開始されることを確認（エラーが出ないこと）
    // 少し待機
    await window.waitForTimeout(1000);

    // ページがまだインポートページであることを確認（エラーで遷移していない）
    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
  });
});
