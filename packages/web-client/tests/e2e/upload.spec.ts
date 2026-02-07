import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('Image Upload', () => {
  const testImagePath = path.join(import.meta.dirname, '../fixtures/test-image-red.png');

  test('should upload an image via dropzone', async ({ page }) => {
    await page.goto('/');

    // Wait for the dropzone to be visible
    await expect(page.getByText('ここに画像をドラッグ＆ドロップ')).toBeVisible();

    // Upload file via input element (Mantine Dropzone has a hidden input)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload success message
    await expect(page.getByText('アップロード完了')).toBeVisible();

    // Navigate to gallery to see uploaded images
    await page.goto('/gallery');

    // Image should appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible();
  });

  test('should show uploaded image in gallery', async ({ page }) => {
    await page.goto('/');

    // Upload a new image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload success message
    await expect(page.getByText('アップロード完了')).toBeVisible();

    // Navigate to gallery to see uploaded images
    await page.goto('/gallery');

    // Image link should appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible();
  });
});
