import { apiClient } from '@/api/client';
import type { Label, CreateLabelInput, UpdateLabelInput } from '@picstash/shared';

export async function fetchLabels(): Promise<Label[]> {
  return apiClient<Label[]>('/labels');
}

export async function fetchLabel(id: string): Promise<Label> {
  return apiClient<Label>(`/labels/${id}`);
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  return apiClient<Label>('/labels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLabel(
  id: string,
  input: UpdateLabelInput,
): Promise<Label> {
  return apiClient<Label>(`/labels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteLabel(id: string): Promise<void> {
  await apiClient<void>(`/labels/${id}`, { method: 'DELETE' });
}
