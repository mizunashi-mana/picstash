import {
  deleteImageById,
  findImageById,
} from '@/infra/database/image-repository.js';
import { deleteFile } from '@/infra/storage/file-storage.js';

export type DeleteImageResult
  = | { success: true }
    | { success: false; error: 'NOT_FOUND' };

export async function deleteImage(imageId: string): Promise<DeleteImageResult> {
  const image = await findImageById(imageId);
  if (image === null) {
    return { success: false, error: 'NOT_FOUND' };
  }

  // Delete files first (so DB record remains if file deletion fails)
  await deleteFile(image.path).catch(() => {
    // Ignore file deletion errors
  });
  if (image.thumbnailPath != null) {
    await deleteFile(image.thumbnailPath).catch(() => {
      // Ignore thumbnail deletion errors
    });
  }

  // Delete database record after files are deleted
  await deleteImageById(imageId);

  return { success: true };
}
