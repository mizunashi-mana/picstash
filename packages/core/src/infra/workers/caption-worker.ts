import { EMBEDDING_DIMENSION } from '../../application/ports/embedding-repository.js';
import { fileExists } from '../../shared/file-utils.js';
import type {
  CaptionService,
  SimilarImageDescription,
} from '../../application/ports/caption-service.js';
import type { EmbeddingRepository } from '../../application/ports/embedding-repository.js';
import type { FileStorage } from '../../application/ports/file-storage.js';
import type { ImageRepository } from '../../application/ports/image-repository.js';
import type { Job } from '../../application/ports/job-queue.js';
import type { OcrService } from '../../application/ports/ocr-service.js';
import type { JobHandler } from '../queue/job-worker.js';

/** キャプション生成ジョブのタイプ名 */
export const CAPTION_JOB_TYPE = 'caption-generation';

/** キャプション生成ジョブのペイロード */
export interface CaptionJobPayload {
  imageId: string;
}

/** キャプション生成ジョブの結果 */
export interface CaptionJobResult {
  description: string;
  model: string;
  usedContext: boolean;
}

/**
 * キャプション生成ワーカーを作成
 */
export function createCaptionJobHandler(deps: {
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  captionService: CaptionService;
  embeddingRepository: EmbeddingRepository;
  ocrService?: OcrService;
}): JobHandler<CaptionJobPayload, CaptionJobResult> {
  const { imageRepository, fileStorage, captionService, embeddingRepository, ocrService } = deps;

  return async (
    job: Job<CaptionJobPayload>,
    updateProgress: (progress: number) => Promise<void>,
  ): Promise<CaptionJobResult> => {
    const { imageId } = job.payload;

    // 10% - 開始
    await updateProgress(10);

    // 画像を取得
    const image = await imageRepository.findById(imageId);
    if (image === null) {
      throw new Error(`Image not found: ${imageId}`);
    }

    // 20% - 画像情報取得完了
    await updateProgress(20);

    // ファイル存在確認
    const absolutePath = fileStorage.getAbsolutePath(image.path);
    if (!(await fileExists(absolutePath))) {
      throw new Error(`Image file not found on disk: ${image.path}`);
    }

    // 30% - ファイル確認完了
    await updateProgress(30);

    // OCR でテキストを抽出（オプション）
    let ocrText: string | undefined;
    if (ocrService !== undefined) {
      try {
        const ocrResult = await ocrService.extractText(absolutePath);
        if (ocrResult.text.trim() !== '') {
          ocrText = ocrResult.text;
        }
      }
      catch (error) {
        // OCR 失敗は無視して続行
        // eslint-disable-next-line no-console -- Log OCR errors for debugging
        console.warn('OCR extraction failed, continuing without OCR text:', error);
      }
    }

    // 40% - OCR 完了
    await updateProgress(40);

    // 類似画像の説明を取得
    const similarDescriptions = await getSimilarImageDescriptions(
      imageId,
      5,
      { imageRepository, embeddingRepository },
    );

    // 50% - 類似画像取得完了
    await updateProgress(50);

    // キャプション生成（重い処理）
    const result = await captionService.generateWithContext(absolutePath, {
      similarDescriptions,
      ocrText,
    });

    // 100% - 完了
    await updateProgress(100);

    return {
      description: result.caption,
      model: result.model,
      usedContext: similarDescriptions.length > 0 || ocrText !== undefined,
    };
  };
}

/**
 * 類似画像の説明を取得（ImageController の private メソッドから抽出）
 */
async function getSimilarImageDescriptions(
  imageId: string,
  limit: number,
  deps: {
    imageRepository: ImageRepository;
    embeddingRepository: EmbeddingRepository;
  },
): Promise<SimilarImageDescription[]> {
  const { imageRepository, embeddingRepository } = deps;

  // Get the image with its embedding
  const imageWithEmbedding = await imageRepository.findByIdWithEmbedding(imageId);
  if (imageWithEmbedding?.embedding === null || imageWithEmbedding?.embedding === undefined) {
    return [];
  }

  // Validate embedding dimension
  const expectedByteLength = EMBEDDING_DIMENSION * 4;
  if (imageWithEmbedding.embedding.byteLength !== expectedByteLength) {
    return [];
  }

  // Convert Uint8Array to Float32Array for similarity search
  const embedding = new Float32Array(
    imageWithEmbedding.embedding.buffer,
    imageWithEmbedding.embedding.byteOffset,
    imageWithEmbedding.embedding.byteLength / 4,
  );

  // Find similar images, excluding the current image
  const similarResults = embeddingRepository.findSimilar(embedding, limit, [imageId]);

  if (similarResults.length === 0) {
    return [];
  }

  // Batch fetch all similar images at once to avoid N+1 queries
  const imageIds = similarResults.map(r => r.imageId);
  const images = await imageRepository.findByIds(imageIds);

  // Create a map for quick lookup
  const imageMap = new Map(images.map(img => [img.id, img]));

  // Build descriptions with similarity scores, preserving similarity order
  const descriptions: SimilarImageDescription[] = [];
  for (const result of similarResults) {
    const image = imageMap.get(result.imageId);
    if (
      image !== undefined
      && image.description !== null
      && image.description.trim() !== ''
    ) {
      // Convert distance to similarity score (0-1, higher is more similar)
      // Using 1 / (1 + distance) formula for smooth mapping
      const similarity = 1 / (1 + result.distance);
      descriptions.push({
        description: image.description,
        similarity,
      });
    }
  }

  return descriptions;
}
