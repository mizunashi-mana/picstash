import type {
  Label,
  CreateLabelInput,
  UpdateLabelInput,
} from '@/domain/label/index.js';

// Re-export domain types for backward compatibility
export type { Label, CreateLabelInput, UpdateLabelInput };

export interface LabelRepository {
  create(input: CreateLabelInput): Promise<Label>;
  findById(id: string): Promise<Label | null>;
  findByName(name: string): Promise<Label | null>;
  findAll(): Promise<Label[]>;
  updateById(id: string, input: UpdateLabelInput): Promise<Label>;
  deleteById(id: string): Promise<Label>;
}
