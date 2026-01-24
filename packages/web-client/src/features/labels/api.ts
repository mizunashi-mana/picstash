import { apiClient } from '@/api/client';
import type { Label, CreateLabelInput, UpdateLabelInput } from '@picstash/api';

export async function fetchLabels(): Promise<Label[]> {
  return await apiClient<Label[]>('/labels');
}

export async function fetchLabel(id: string): Promise<Label> {
  return await apiClient<Label>(`/labels/${id}`);
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  return await apiClient<Label>('/labels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLabel(
  id: string,
  input: UpdateLabelInput,
): Promise<Label> {
  return await apiClient<Label>(`/labels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteLabel(id: string): Promise<void> {
  await apiClient<undefined>(`/labels/${id}`, { method: 'DELETE' });
}
