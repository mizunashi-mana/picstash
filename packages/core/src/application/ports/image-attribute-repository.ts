import type {
  ImageAttribute,
  CreateImageAttributeInput,
  UpdateImageAttributeInput,
} from '../../domain/image-attribute/index.js';

// Re-export domain types for backward compatibility
export type { ImageAttribute, CreateImageAttributeInput, UpdateImageAttributeInput };

export interface ImageAttributeRepository {
  findById: (id: string) => Promise<ImageAttribute | null>;
  findByImageId: (imageId: string) => Promise<ImageAttribute[]>;
  findByImageAndLabel: (imageId: string, labelId: string) => Promise<ImageAttribute | null>;
  create: (input: CreateImageAttributeInput) => Promise<ImageAttribute>;
  updateById: (id: string, input: UpdateImageAttributeInput) => Promise<ImageAttribute>;
  deleteById: (id: string) => Promise<void>;
}
