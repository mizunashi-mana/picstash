import type { Label } from './label-repository.js';

export interface ImageAttribute {
  id: string;
  imageId: string;
  labelId: string;
  keywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  label: Label;
}

export interface CreateImageAttributeInput {
  imageId: string;
  labelId: string;
  keywords?: string;
}

export interface UpdateImageAttributeInput {
  keywords?: string;
}

export interface ImageAttributeRepository {
  findById(id: string): Promise<ImageAttribute | null>;
  findByImageId(imageId: string): Promise<ImageAttribute[]>;
  findByImageAndLabel(imageId: string, labelId: string): Promise<ImageAttribute | null>;
  create(input: CreateImageAttributeInput): Promise<ImageAttribute>;
  updateById(id: string, input: UpdateImageAttributeInput): Promise<ImageAttribute>;
  deleteById(id: string): Promise<void>;
}
