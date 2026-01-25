import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api/client';
import {
  fetchLabels,
  fetchLabel,
  createLabel,
  updateLabel,
  deleteLabel,
} from '@/features/labels/api';

vi.mock('@/api/client');

describe('labels/api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchLabels', () => {
    it('should fetch all labels', async () => {
      const mockLabels = [
        { id: '1', name: 'Label 1', parentId: null },
        { id: '2', name: 'Label 2', parentId: '1' },
      ];
      vi.mocked(apiClient).mockResolvedValue(mockLabels);

      const result = await fetchLabels();

      expect(apiClient).toHaveBeenCalledWith('/api/labels');
      expect(result).toEqual(mockLabels);
    });
  });

  describe('fetchLabel', () => {
    it('should fetch a specific label by id', async () => {
      const mockLabel = { id: '1', name: 'Label 1', parentId: null };
      vi.mocked(apiClient).mockResolvedValue(mockLabel);

      const result = await fetchLabel('1');

      expect(apiClient).toHaveBeenCalledWith('/api/labels/1');
      expect(result).toEqual(mockLabel);
    });
  });

  describe('createLabel', () => {
    it('should create a new label', async () => {
      const input = { name: 'New Label' };
      const mockLabel = { id: '3', name: 'New Label', parentId: null };
      vi.mocked(apiClient).mockResolvedValue(mockLabel);

      const result = await createLabel(input);

      expect(apiClient).toHaveBeenCalledWith('/api/labels', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockLabel);
    });

    it('should create a label with parentId', async () => {
      const input = { name: 'Child Label', parentId: '1' };
      const mockLabel = { id: '4', name: 'Child Label', parentId: '1' };
      vi.mocked(apiClient).mockResolvedValue(mockLabel);

      const result = await createLabel(input);

      expect(apiClient).toHaveBeenCalledWith('/api/labels', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockLabel);
    });
  });

  describe('updateLabel', () => {
    it('should update an existing label', async () => {
      const input = { name: 'Updated Label' };
      const mockLabel = { id: '1', name: 'Updated Label', parentId: null };
      vi.mocked(apiClient).mockResolvedValue(mockLabel);

      const result = await updateLabel('1', input);

      expect(apiClient).toHaveBeenCalledWith('/api/labels/1', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockLabel);
    });
  });

  describe('deleteLabel', () => {
    it('should delete a label', async () => {
      vi.mocked(apiClient).mockResolvedValue(undefined);

      await deleteLabel('1');

      expect(apiClient).toHaveBeenCalledWith('/api/labels/1', { method: 'DELETE' });
    });
  });
});
