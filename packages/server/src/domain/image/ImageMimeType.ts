/**
 * Supported MIME types for images
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;

export type AllowedImageMimeType = typeof ALLOWED_IMAGE_MIME_TYPES[number];

/**
 * Image MIME type value object
 */
export class ImageMimeType {
  private constructor(readonly value: AllowedImageMimeType) {}

  static create(mimeType: string): ImageMimeType | null {
    if (ImageMimeType.isValid(mimeType)) {
      return new ImageMimeType(mimeType);
    }
    return null;
  }

  static isValid(mimeType: string): mimeType is AllowedImageMimeType {
    return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType);
  }

  static getAllowedTypes(): readonly string[] {
    return ALLOWED_IMAGE_MIME_TYPES;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ImageMimeType): boolean {
    return this.value === other.value;
  }
}
