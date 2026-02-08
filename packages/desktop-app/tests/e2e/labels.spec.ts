import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(currentDir, '..', '..');

// E2E テスト用のデータディレクトリ
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-labels-data');

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

test.describe('ラベルページ', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'ラベル' }).click();
    await expect(window.getByRole('heading', { name: 'ラベル管理', level: 2 })).toBeVisible();
  });

  test('ラベルページが表示される', async () => {
    await expect(window.getByRole('heading', { name: 'ラベル管理', level: 2 })).toBeVisible();
    await expect(window.getByText('画像を整理するためのラベルを作成・管理します')).toBeVisible();
  });

  test('ラベル作成フォームが表示される', async () => {
    await expect(window.getByRole('heading', { name: '新しいラベルを作成', level: 4 })).toBeVisible();
    await expect(window.getByRole('textbox', { name: 'ラベル名' })).toBeVisible();
    await expect(window.getByRole('textbox', { name: 'カラー' })).toBeVisible();
  });

  test('ラベル一覧が表示される', async () => {
    // ラベルがない場合は空状態のメッセージ、ある場合はリストが表示される
    await expect(window.getByRole('heading', { name: 'ラベル一覧', level: 4 })).toBeVisible();
  });
});

test.describe('ラベル作成', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'ラベル' }).click();
    await expect(window.getByRole('heading', { name: 'ラベル管理', level: 2 })).toBeVisible();
  });

  test('ラベル名を入力すると作成ボタンが有効になる', async () => {
    const nameInput = window.getByRole('textbox', { name: 'ラベル名' });
    await nameInput.fill('テストラベル');

    // 作成ボタンをクリックできる
    const createButton = window.getByRole('button', { name: 'ラベルを作成' });
    await createButton.click();

    // ラベルが作成される
    await expect(window.getByText('テストラベル')).toBeVisible();
  });

  test('ラベル作成後は空状態メッセージが消える', async () => {
    // 前のテストで作成したラベルが存在する
    await expect(window.getByText('テストラベル')).toBeVisible();
    await expect(window.getByText('ラベルがまだありません')).toBeHidden();
  });

  test('複数のラベルを作成できる', async () => {
    const nameInput = window.getByRole('textbox', { name: 'ラベル名' });

    // 2つ目のラベルを作成
    await nameInput.fill('ラベル2');
    await window.getByRole('button', { name: 'ラベルを作成' }).click();
    await expect(window.getByText('ラベル2')).toBeVisible();

    // 3つ目のラベルを作成
    await nameInput.fill('ラベル3');
    await window.getByRole('button', { name: 'ラベルを作成' }).click();
    await expect(window.getByText('ラベル3')).toBeVisible();

    // 全てのラベルが表示されている
    await expect(window.getByText('テストラベル')).toBeVisible();
    await expect(window.getByText('ラベル2')).toBeVisible();
    await expect(window.getByText('ラベル3')).toBeVisible();
  });
});
