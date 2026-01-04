import type { Label, LabelRepository } from '@/application/ports/label-repository.js';

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export type CreateLabelResult
  = | { success: true; label: Label }
    | { success: false; error: 'EMPTY_NAME' }
    | { success: false; error: 'DUPLICATE_NAME'; name: string };

export interface CreateLabelDeps {
  labelRepository: LabelRepository;
}

export async function createLabel(
  input: CreateLabelInput,
  deps: CreateLabelDeps,
): Promise<CreateLabelResult> {
  const { name, color } = input;
  const { labelRepository } = deps;

  // Validate name
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return { success: false, error: 'EMPTY_NAME' };
  }

  // Check for duplicate
  const existing = await labelRepository.findByName(trimmedName);
  if (existing !== null) {
    return { success: false, error: 'DUPLICATE_NAME', name: trimmedName };
  }

  const label = await labelRepository.create({
    name: trimmedName,
    color: color?.trim(),
  });

  return { success: true, label };
}
