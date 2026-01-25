import { LabelName, LABEL_NAME_MAX_LENGTH } from '../../domain/label/index.js';
import type { Label, LabelRepository } from '../ports/label-repository.js';

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export type CreateLabelResult
  = | { success: true; label: Label }
    | { success: false; error: 'EMPTY_NAME' }
    | { success: false; error: 'NAME_TOO_LONG'; maxLength: number }
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

  // Validate name using domain value object
  const validationError = LabelName.validate(name);
  if (validationError === 'EMPTY') {
    return { success: false, error: 'EMPTY_NAME' };
  }
  if (validationError === 'TOO_LONG') {
    return { success: false, error: 'NAME_TOO_LONG', maxLength: LABEL_NAME_MAX_LENGTH };
  }
  const trimmedName = name.trim();

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
