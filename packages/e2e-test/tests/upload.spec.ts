import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('Image Upload', () => {
  const testImagePath = path.join(import.meta.dirname, '../fixtures/test-image-red.png');

  test('should upload an image via dropzone', async ({ page }) => {
    await page.goto('/');

    // Wait for the dropzone to be visible
    await expect(page.getByText('ここに画像をドラッグ＆ドロップ')).toBeVisible();

    // Set up response listener before triggering upload
    const uploadResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/images') && response.request().method() === 'POST',
    );

    // Upload file via input element (Mantine Dropzone has a hidden input)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload API response
    const response = await uploadResponsePromise;
    expect(response.status()).toBe(201);

    // Wait for image to appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible();
  });

  test('should show uploaded image in gallery', async ({ page }) => {
    await page.goto('/');

    // Set up response listener before triggering upload
    const uploadResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/images') && response.request().method() === 'POST',
    );

    // Always upload a new image for this test
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload API response
    const response = await uploadResponsePromise;
    expect(response.status()).toBe(201);

    // Image link should appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible();
  });
});
