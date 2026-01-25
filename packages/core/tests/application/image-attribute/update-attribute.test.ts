import { describe, expect, it, vi } from 'vitest';
import { updateAttribute } from '@/application/image-attribute/update-attribute.js';
import type {
  ImageAttributeRepository,
  UpdateImageAttributeInput,
} from '@/application/ports/image-attribute-repository.js';

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
    updateById: vi
      .fn()
      .mockImplementation(
        async (id: string, input: UpdateImageAttributeInput) => ({
          ...mockAttribute,
          id,
          keywords: input.keywords ?? mockAttribute.keywords,
          updatedAt: new Date(),
        }),
      ),
    deleteById: vi.fn(),
    ...overrides,
  };
}

describe('updateAttribute', () => {
  it('should update attribute keywords successfully', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await updateAttribute(
      { imageId: 'image-1', attributeId: 'attr-1', keywords: 'new,keywords' },
      { imageAttributeRepository },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.attribute.id).toBe('attr-1');
    }
    expect(imageAttributeRepository.updateById).toHaveBeenCalledWith('attr-1', {
      keywords: 'new,keywords',
    });
  });

  it('should normalize keywords', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    await updateAttribute(
      { imageId: 'image-1', attributeId: 'attr-1', keywords: '  foo  ,  bar  ' },
      { imageAttributeRepository },
    );

    expect(imageAttributeRepository.updateById).toHaveBeenCalledWith('attr-1', {
      keywords: 'foo,bar',
    });
  });

  it('should clear keywords when empty string provided', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    await updateAttribute(
      { imageId: 'image-1', attributeId: 'attr-1', keywords: '' },
      { imageAttributeRepository },
    );

    expect(imageAttributeRepository.updateById).toHaveBeenCalledWith('attr-1', {
      keywords: undefined,
    });
  });

  it('should update with undefined keywords when not provided', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    await updateAttribute(
      { imageId: 'image-1', attributeId: 'attr-1' },
      { imageAttributeRepository },
    );

    expect(imageAttributeRepository.updateById).toHaveBeenCalledWith('attr-1', {
      keywords: undefined,
    });
  });

  it('should return ATTRIBUTE_NOT_FOUND error if attribute does not exist', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await updateAttribute(
      { imageId: 'image-1', attributeId: 'nonexistent', keywords: 'test' },
      { imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'ATTRIBUTE_NOT_FOUND' });
    expect(imageAttributeRepository.updateById).not.toHaveBeenCalled();
  });

  it('should return ATTRIBUTE_MISMATCH error if attribute belongs to different image', async () => {
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await updateAttribute(
      { imageId: 'different-image', attributeId: 'attr-1', keywords: 'test' },
      { imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'ATTRIBUTE_MISMATCH' });
    expect(imageAttributeRepository.updateById).not.toHaveBeenCalled();
  });
});
