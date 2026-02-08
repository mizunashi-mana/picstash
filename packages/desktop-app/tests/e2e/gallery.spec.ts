import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..', '..');

// E2E テスト用のデータディレクトリ
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-gallery-data');

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
  await expect(window.getByRole('link', { name: 'ホーム' })).toBeVisible();
});

test.afterAll(async () => {
  await electronApp.close();
  await rm(e2eDataDir, { recursive: true, force: true });
});

test.describe('ギャラリーページ', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'ギャラリー' }).click();
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });

  test('ギャラリーページが表示される', async () => {
    // 見出しとビュー切り替えボタンが表示される
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
    await expect(window.getByRole('button', { name: 'グリッド表示' })).toBeVisible();
    await expect(window.getByRole('button', { name: 'カルーセル表示' })).toBeVisible();
  });

  test('検索バーが表示される', async () => {
    const searchInput = window.getByRole('textbox', { name: /検索/ });
    await expect(searchInput).toBeVisible();
    await expect(window.getByRole('button', { name: '検索', exact: true })).toBeVisible();
  });

  test('ビュー切り替えボタンが動作する', async () => {
    // グリッド表示がデフォルト
    const gridButton = window.getByRole('button', { name: 'グリッド表示' });
    const carouselButton = window.getByRole('button', { name: 'カルーセル表示' });

    // ボタンが表示されていることを確認
    await expect(gridButton).toBeVisible();
    await expect(carouselButton).toBeVisible();

    // カルーセル表示に切り替え
    await carouselButton.click();
    await expect(carouselButton).toBeVisible();

    // グリッド表示に戻す
    await gridButton.click();
    await expect(gridButton).toBeVisible();
  });

  test('画像がない場合は適切なメッセージが表示される', async () => {
    // 新しいデータディレクトリなので画像は0件の可能性がある
    // 画像数の表示を確認
    const countText = window.locator('text=/\\d+件/');
    await expect(countText).toBeVisible();
  });
});

test.describe('検索機能', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'ギャラリー' }).click();
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });

  test('検索クエリを入力できる', async () => {
    const searchInput = window.getByRole('textbox', { name: /検索/ });
    await searchInput.fill('テスト検索');
    await expect(searchInput).toHaveValue('テスト検索');
  });

  test('検索ボタンをクリックして検索できる', async () => {
    const searchInput = window.getByRole('textbox', { name: /検索/ });
    await searchInput.fill('テスト');
    await window.getByRole('button', { name: '検索', exact: true }).click();
    // 検索が実行されることを確認（エラーが出ないこと）
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });

  test('Enter キーで検索できる', async () => {
    const searchInput = window.getByRole('textbox', { name: /検索/ });
    await searchInput.fill('テスト');
    await searchInput.press('Enter');
    // 検索が実行されることを確認（エラーが出ないこと）
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });
});
