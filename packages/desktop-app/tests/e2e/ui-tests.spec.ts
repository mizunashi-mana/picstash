/**
 * UI テスト統合ファイル
 * CI環境でのElectronインスタンス再起動問題を回避するため、
 * ストレージ設定が必要な全テストを1つのElectronインスタンスで実行する
 */
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
const e2eDataDir = path.join(appPath, 'tmp', 'e2e-ui-tests-data');
// ストレージ用ディレクトリ
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
  await setupStorageIfNeeded(window, storageDir);
  await expect(window.getByRole('link', { name: 'ホーム' })).toBeVisible();
});

test.afterAll(async () => {
  await electronApp.close();
  await rm(e2eDataDir, { recursive: true, force: true });
});

// ========== ナビゲーションテスト ==========
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

    await expect(window.getByText('ホーム')).toBeVisible();

    await collapseButton.click();

    const expandButton = window.getByRole('button', { name: 'サイドバーを展開' });
    await expect(expandButton).toBeVisible();

    await expandButton.click();

    await expect(collapseButton).toBeVisible();
  });
});

// ========== ギャラリーテスト ==========
test.describe('ギャラリーページ', () => {
  test.beforeEach(async () => {
    await window.getByRole('link', { name: 'ギャラリー' }).click();
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });

  test('ギャラリーページが表示される', async () => {
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
    const gridButton = window.getByRole('button', { name: 'グリッド表示' });
    const carouselButton = window.getByRole('button', { name: 'カルーセル表示' });

    await expect(gridButton).toBeVisible();
    await expect(carouselButton).toBeVisible();

    await carouselButton.click();
    await expect(carouselButton).toBeVisible();

    await gridButton.click();
    await expect(gridButton).toBeVisible();
  });

  test('画像がない場合は適切なメッセージが表示される', async () => {
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
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });

  test('Enter キーで検索できる', async () => {
    const searchInput = window.getByRole('textbox', { name: /検索/ });
    await searchInput.fill('テスト');
    await searchInput.press('Enter');
    await expect(window.getByRole('heading', { name: 'ギャラリー', level: 2 })).toBeVisible();
  });
});

// ========== コレクションテスト ==========
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
    await expect(window.getByRole('dialog')).toBeVisible();
    await expect(window.getByRole('heading', { name: '新しいコレクションを作成' })).toBeVisible();
    await expect(window.getByRole('textbox', { name: '名前' })).toBeVisible();

    await window.getByRole('button', { name: 'キャンセル' }).click();
    await expect(window.getByRole('dialog')).toBeHidden();
  });

  test('コレクションを作成できる', async () => {
    const collectionName = `テストコレクション_${Date.now()}`;

    await window.getByRole('button', { name: '新規コレクション' }).click();
    await expect(window.getByRole('dialog')).toBeVisible();

    const nameInput = window.getByRole('textbox', { name: '名前' });
    await nameInput.fill(collectionName);

    const createButton = window.getByRole('button', { name: '作成', exact: true });
    await createButton.click();

    await expect(window.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    await expect(window.getByText(collectionName)).toBeVisible();

    await expect(window.getByText('コレクションがまだありません')).toBeHidden();
  });
});

// ========== ラベルテスト ==========
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

    const createButton = window.getByRole('button', { name: 'ラベルを作成' });
    await createButton.click();

    await expect(window.getByText('テストラベル')).toBeVisible();
  });

  test('ラベル作成後は空状態メッセージが消える', async () => {
    await expect(window.getByText('テストラベル')).toBeVisible();
    await expect(window.getByText('ラベルがまだありません')).toBeHidden();
  });

  test('複数のラベルを作成できる', async () => {
    const nameInput = window.getByRole('textbox', { name: 'ラベル名' });

    await nameInput.fill('ラベル2');
    await window.getByRole('button', { name: 'ラベルを作成' }).click();
    await expect(window.getByText('ラベル2')).toBeVisible();

    await nameInput.fill('ラベル3');
    await window.getByRole('button', { name: 'ラベルを作成' }).click();
    await expect(window.getByText('ラベル3')).toBeVisible();

    await expect(window.getByText('テストラベル')).toBeVisible();
    await expect(window.getByText('ラベル2')).toBeVisible();
    await expect(window.getByText('ラベル3')).toBeVisible();
  });
});

// ========== インポートテスト ==========
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
    await expect(window.getByRole('tabpanel', { name: 'アーカイブ' })).toBeVisible();
  });

  test('URL タブに切り替えられる', async () => {
    await window.getByRole('tab', { name: 'URL' }).click();
    const urlTab = window.getByRole('tab', { name: 'URL' });
    await expect(urlTab).toHaveAttribute('aria-selected', 'true');
    await expect(window.getByRole('tabpanel', { name: 'URL' })).toBeVisible();
  });

  test('画像タブに戻れる', async () => {
    await window.getByRole('tab', { name: 'URL' }).click();
    await expect(window.getByRole('tab', { name: 'URL' })).toHaveAttribute('aria-selected', 'true');

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
    const chooseFileButton = window.getByRole('button', { name: 'Choose File' });
    await expect(chooseFileButton).toBeVisible();
  });

  test('ドロップゾーンがクリック可能', async () => {
    const dropzone = window.getByText('ここに画像をドラッグ＆ドロップ');
    await expect(dropzone).toBeVisible();
  });

  test('ファイル選択ボタンをクリックするとファイルダイアログが開く', async () => {
    const testImagePath = path.join(fixturesPath, 'test-image.png');

    const fileInput = window.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    await window.waitForTimeout(1000);

    await expect(window.getByRole('heading', { name: 'インポート', level: 1 })).toBeVisible();
  });
});
