import type { LabelEntity } from '@/domain/label/index.js';

/**
 * ImageAttribute entity - represents a label with keywords assigned to an image
 */
export interface ImageAttribute {
  id: string;
  imageId: string;
  labelId: string;
  keywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  label: LabelEntity;
}

/**
 * Input for creating a new image attribute
 */
export interface CreateImageAttributeInput {
  imageId: string;
  labelId: string;
  keywords?: string;
}

/**
 * Input for updating an image attribute
 */
export interface UpdateImageAttributeInput {
  keywords?: string;
}
