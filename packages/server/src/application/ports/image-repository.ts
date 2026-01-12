import type {
  Image,
  CreateImageInput,
  UpdateImageInput,
} from '@/domain/image/index.js';

// Re-export domain types for backward compatibility
export type { Image, CreateImageInput, UpdateImageInput };

export interface ImageRepository {
  create(input: CreateImageInput): Promise<Image>;
  findById(id: string): Promise<Image | null>;
  findAll(): Promise<Image[]>;
  search(query: string): Promise<Image[]>;
  updateById(id: string, input: UpdateImageInput): Promise<Image>;
  deleteById(id: string): Promise<Image>;
}
