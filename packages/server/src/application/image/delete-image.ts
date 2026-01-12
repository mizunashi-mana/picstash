import { removeEmbedding } from '@/application/embedding/generate-embedding.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';

export type DeleteImageResult
  = | { success: true }
    | { success: false; error: 'NOT_FOUND' };

export interface DeleteImageDeps {
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
}

export async function deleteImage(
  imageId: string,
  deps: DeleteImageDeps,
): Promise<DeleteImageResult> {
  const { imageRepository, fileStorage } = deps;

  const image = await imageRepository.findById(imageId);
  if (image === null) {
    return { success: false, error: 'NOT_FOUND' };
  }

  // Delete files first (so DB record remains if file deletion fails)
  await fileStorage.deleteFile(image.path).catch(() => {
    // Ignore file deletion errors
  });
  if (image.thumbnailPath != null) {
    await fileStorage.deleteFile(image.thumbnailPath).catch(() => {
      // Ignore thumbnail deletion errors
    });
  }

  // Delete database record after files are deleted
  await imageRepository.deleteById(imageId);

  // Remove embedding from vector database
  removeEmbedding(imageId);

  return { success: true };
}
