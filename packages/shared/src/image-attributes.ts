/**
 * Image attribute type definitions
 */

import type { Label } from './labels.js';

export interface ImageAttribute {
  id: string;
  imageId: string;
  labelId: string;
  keywords: string | null;
  label: Label;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImageAttributeInput {
  labelId: string;
  keywords?: string;
}

export interface UpdateImageAttributeInput {
  keywords?: string;
}
