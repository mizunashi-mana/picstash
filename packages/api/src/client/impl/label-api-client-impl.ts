/**
 * Label API Client Implementation
 */

import {
  labelsEndpoints,
  type CreateLabelInput,
  type Label,
  type UpdateLabelInput,
} from '@/labels.js';
import type { HttpClient } from '@/client/http-client.js';
import type { LabelApiClient } from '@/client/label-api-client.js';

export function createLabelApiClient(http: HttpClient): LabelApiClient {
  return {
    list: async () => await http.get<Label[]>(labelsEndpoints.list),

    detail: async (labelId: string) =>
      await http.get<Label>(labelsEndpoints.detail(labelId)),

    create: async (input: CreateLabelInput) =>
      await http.post<Label>(labelsEndpoints.create, input),

    update: async (labelId: string, input: UpdateLabelInput) =>
      await http.put<Label>(labelsEndpoints.update(labelId), input),

    delete: async (labelId: string) => {
      await http.delete(labelsEndpoints.delete(labelId));
    },
  };
}
