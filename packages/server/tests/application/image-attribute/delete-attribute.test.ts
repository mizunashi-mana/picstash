import { describe, expect, it, vi } from 'vitest';
import { deleteAttribute } from '@/application/image-attribute/delete-attribute.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';

const mockLabel = {
  id: 'label-1',
  name: 'Test Label',
  color: '#ff0000',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAttribute = {
  id: 'attr-1',
  imageId: 'image-1',
  labelId: 'label-1',
  keywords: 'keyword1,keyword2',
  createdAt: new Date(),
  updatedAt: new Date(),
  label: mockLabel,
};

function createMockImageAttributeRepository(
  overrides: Partial<ImageAttributeRepository> = {},
): ImageAttributeRepository {
  return {
    findById: vi.fn().mockResolvedValue(mockAttribute),
    findByImageId: vi.fn().mockResolvedValue([]),
    findByImageAndLabel: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('deleteAttribute', () => {
  it('should delete attribute successfully', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await deleteAttribute(
      { imageId: 'image-1', attributeId: 'attr-1' },
      { imageAttributeRepository },
    );

    expect(result).toEqual({ success: true });
    expect(imageAttributeRepository.deleteById).toHaveBeenCalledWith('attr-1');
  });

  it('should return ATTRIBUTE_NOT_FOUND error if attribute does not exist', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await deleteAttribute(
      { imageId: 'image-1', attributeId: 'nonexistent' },
      { imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'ATTRIBUTE_NOT_FOUND' });
    expect(imageAttributeRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should return ATTRIBUTE_MISMATCH error if attribute belongs to different image', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await deleteAttribute(
      { imageId: 'different-image', attributeId: 'attr-1' },
      { imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'ATTRIBUTE_MISMATCH' });
    expect(imageAttributeRepository.deleteById).not.toHaveBeenCalled();
  });
});
