import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('Image Delete', () => {
  const testImagePath = path.join(import.meta.dirname, '../fixtures/test-image-red.png');

  test('should delete an image from detail page', async ({ page }) => {
    // Upload an image first
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for image to appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible({ timeout: 30000 });

    // Navigate to image detail
    const galleryImage = page.locator('a[href^="/images/"]').first();

    // Get the image URL before navigating
    const href = await galleryImage.getAttribute('href');
    await galleryImage.click();

    // Should be on detail page
    await expect(page).toHaveURL(/\/images\/.+/);

    // Click delete button
    await page.getByRole('button', { name: '画像を削除' }).click();

    // Confirm deletion modal should appear
    const deleteModal = page.getByRole('dialog', { name: '画像を削除' });
    await expect(deleteModal.getByText('この画像を削除しますか？')).toBeVisible();

    // Click confirm delete button and wait for successful API response
    const deleteResponsePromise = page.waitForResponse(
      response => response.url().includes('/images/') && response.request().method() === 'DELETE',
    );
    await deleteModal.getByRole('button', { name: '削除' }).click();
    await deleteResponsePromise;

    // Wait for the modal to close first
    await expect(deleteModal).not.toBeVisible({ timeout: 10000 });

    // Should navigate back to home (give it more time for the delete operation)
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // The deleted image should no longer appear in the gallery
    // href is always non-null since we got it from the gallery image
    expect(href).not.toBeNull();
    await expect(page.locator(`a[href="${href}"]`)).toBeHidden({ timeout: 5000 });
  });

  test('should cancel deletion when clicking cancel button', async ({ page }) => {
    // Upload an image first
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for image to appear in gallery
    await expect(page.locator('a[href^="/images/"]').first()).toBeVisible({ timeout: 30000 });

    // Navigate to image detail
    const galleryImage = page.locator('a[href^="/images/"]').first();
    await galleryImage.click();

    // Click delete button
    await page.getByRole('button', { name: '画像を削除' }).click();

    // Confirm deletion modal should appear
    await expect(page.getByText('この画像を削除しますか？')).toBeVisible();

    // Click cancel button
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // Should still be on detail page
    await expect(page).toHaveURL(/\/images\/.+/);

    // Modal should be closed
    await expect(page.getByText('この画像を削除しますか？')).toBeHidden();
  });
});
