import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { setupStorageIfNeeded } from './helpers.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..', '..');

// E2E テスト用のデータディレクトリ
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-collections-data');
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

test.describe('コレクションページ', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'コレクション', exact: true }).click();
    await expect(window.getByRole('heading', { name: 'コレクション', level: 2 })).toBeVisible();
  });

  test('コレクションページが表示される', async () => {
    await expect(window.getByRole('heading', { name: 'コレクション', level: 2 })).toBeVisible();
    await expect(window.getByText('画像をコレクションに整理します')).toBeVisible();
  });

  test('新規コレクションボタンが表示される', async () => {
    await expect(window.getByRole('button', { name: '新規コレクション' })).toBeVisible();
  });

  test('新規コレクションボタンが常に表示される', async () => {
    // 新規コレクションボタンは常に表示される
    const newCollectionButton = window.getByRole('button', { name: '新規コレクション' });
    await expect(newCollectionButton).toBeVisible();
  });
});

test.describe('コレクション作成', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'コレクション', exact: true }).click();
    await expect(window.getByRole('heading', { name: 'コレクション', level: 2 })).toBeVisible();
  });

  test('新規コレクションボタンをクリックするとモーダルが開く', async () => {
    await window.getByRole('button', { name: '新規コレクション' }).click();
    // モーダルが開くことを確認
    await expect(window.getByRole('dialog')).toBeVisible();
    await expect(window.getByRole('heading', { name: '新しいコレクションを作成' })).toBeVisible();
    await expect(window.getByRole('textbox', { name: '名前' })).toBeVisible();

    // キャンセルボタンでモーダルを閉じる
    await window.getByRole('button', { name: 'キャンセル' }).click();
    await expect(window.getByRole('dialog')).toBeHidden();
  });

  test('コレクションを作成できる', async () => {
    // ユニークなコレクション名を生成
    const collectionName = `テストコレクション_${Date.now()}`;

    await window.getByRole('button', { name: '新規コレクション' }).click();
    await expect(window.getByRole('dialog')).toBeVisible();

    // コレクション名を入力
    const nameInput = window.getByRole('textbox', { name: '名前' });
    await nameInput.fill(collectionName);

    // 入力後、作成ボタンをクリック（入力によりボタンが有効になる）
    const createButton = window.getByRole('button', { name: '作成', exact: true });
    await createButton.click();

    // モーダルが閉じることを確認
    await expect(window.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // 作成されたコレクションが一覧に表示される
    await expect(window.getByText(collectionName)).toBeVisible();

    // 空状態のメッセージが表示されないことを確認
    await expect(window.getByText('コレクションがまだありません')).toBeHidden();
  });
});
