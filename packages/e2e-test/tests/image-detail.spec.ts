import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('Image Detail', () => {
  const testImagePath = path.join(import.meta.dirname, '../fixtures/test-image-blue.png');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Always upload a test image to ensure a consistent state
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for image to appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible({ timeout: 30000 });
  });

  test('should display image detail page when clicking an image', async ({ page }) => {
    // Click on the first image in the gallery
    const galleryImage = page.locator('a[href^="/images/"]').first();
    await galleryImage.click();

    // Should navigate to image detail page
    await expect(page).toHaveURL(/\/images\/.+/);

    // Check for detail page elements
    await expect(page.getByRole('heading', { name: 'ファイル情報' })).toBeVisible();
    await expect(page.getByText('サイズ', { exact: true })).toBeVisible();
    await expect(page.getByText('ファイルサイズ')).toBeVisible();
    await expect(page.getByText('形式')).toBeVisible();
    await expect(page.getByText('アップロード日時')).toBeVisible();
  });

  test('should navigate back to gallery', async ({ page }) => {
    // Navigate to image detail
    const galleryImage = page.locator('a[href^="/images/"]').first();
    await galleryImage.click();
    await expect(page).toHaveURL(/\/images\/.+/);

    // Click back button
    await page.getByRole('link', { name: 'ギャラリーに戻る' }).click();

    // Should be back on homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1').getByText('Picstash')).toBeVisible();
  });

  test('should display image with correct format info', async ({ page }) => {
    // Navigate to image detail
    const galleryImage = page.locator('a[href^="/images/"]').first();
    await galleryImage.click();

    // Check that PNG format is displayed
    await expect(page.getByText('image/png')).toBeVisible();
  });
});
