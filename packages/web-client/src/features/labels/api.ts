import { apiClient } from '@/api/client';
import {
  labelsEndpoints,
  type Label,
  type CreateLabelInput,
  type UpdateLabelInput,
} from '@picstash/api';

export async function fetchLabels(): Promise<Label[]> {
  return await apiClient<Label[]>(labelsEndpoints.list);
}

export async function fetchLabel(id: string): Promise<Label> {
  return await apiClient<Label>(labelsEndpoints.detail(id));
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  return await apiClient<Label>(labelsEndpoints.create, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLabel(
  id: string,
  input: UpdateLabelInput,
): Promise<Label> {
  return await apiClient<Label>(labelsEndpoints.update(id), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteLabel(id: string): Promise<void> {
  await apiClient<undefined>(labelsEndpoints.delete(id), { method: 'DELETE' });
}
