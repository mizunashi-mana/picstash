import { expect, test } from '@playwright/test';

test.describe('Gallery', () => {
  test('should display the homepage with gallery', async ({ page }) => {
    await page.goto('/');

    // Check main page title (h1)
    await expect(page.locator('h1').getByText('Picstash')).toBeVisible();

    // Check subtitle
    await expect(page.getByText('あなたの画像ライブラリ')).toBeVisible();

    // Check dropzone area exists
    await expect(page.getByText('ここに画像をドラッグ＆ドロップ')).toBeVisible();
  });

  test('should display search bar', async ({ page }) => {
    await page.goto('/');

    // Check search input exists
    await expect(page.getByPlaceholder('検索...')).toBeVisible();
  });

  test('should navigate using sidebar', async ({ page }) => {
    await page.goto('/');

    // Check sidebar links exist
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'コレクション' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ラベル' })).toBeVisible();
  });
});
