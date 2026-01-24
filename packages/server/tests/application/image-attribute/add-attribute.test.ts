import { describe, expect, it, vi } from 'vitest';
import { addAttribute } from '@/application/image-attribute/add-attribute.js';
import type {
  CreateImageAttributeInput,
  ImageAttributeRepository,
} from '@/application/ports/image-attribute-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';

const mockImage = {
  id: 'image-1',
  path: '/path/to/image.jpg',
  title: 'Test Image',
  description: null,
  sourceUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  embeddedAt: null,
};

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

function createMockImageRepository(
  overrides: Partial<ImageRepository> = {},
): ImageRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockImage),
    findByIds: vi.fn().mockResolvedValue([]),
    findAll: vi.fn().mockResolvedValue([]),
    findAllPaginated: vi.fn(),
    search: vi.fn().mockResolvedValue([]),
    searchPaginated: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findIdsWithoutEmbedding: vi.fn().mockResolvedValue([]),
    findByIdWithEmbedding: vi.fn().mockResolvedValue(null),
    findWithEmbedding: vi.fn().mockResolvedValue([]),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    countWithEmbedding: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function createMockLabelRepository(
  overrides: Partial<LabelRepository> = {},
): LabelRepository {
  return {
    findById: vi.fn().mockResolvedValue(mockLabel),
    findByName: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    ...overrides,
  };
}

function createMockImageAttributeRepository(
  overrides: Partial<ImageAttributeRepository> = {},
): ImageAttributeRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByImageId: vi.fn().mockResolvedValue([]),
    findByImageAndLabel: vi.fn().mockResolvedValue(null),
    create: vi
      .fn()
      .mockImplementation(async (input: CreateImageAttributeInput) => ({
        id: 'new-attr-id',
        imageId: input.imageId,
        labelId: input.labelId,
        keywords: input.keywords ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        label: mockLabel,
      })),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    ...overrides,
  };
}

describe('addAttribute', () => {
  it('should add attribute successfully', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await addAttribute(
      { imageId: 'image-1', labelId: 'label-1', keywords: 'test,keywords' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.attribute.imageId).toBe('image-1');
      expect(result.attribute.labelId).toBe('label-1');
    }
    expect(imageAttributeRepository.create).toHaveBeenCalledWith({
      imageId: 'image-1',
      labelId: 'label-1',
      keywords: 'test,keywords',
    });
  });

  it('should add attribute without keywords', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await addAttribute(
      { imageId: 'image-1', labelId: 'label-1' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result.success).toBe(true);
    expect(imageAttributeRepository.create).toHaveBeenCalledWith({
      imageId: 'image-1',
      labelId: 'label-1',
      keywords: undefined,
    });
  });

  it('should normalize keywords', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository();

    await addAttribute(
      { imageId: 'image-1', labelId: 'label-1', keywords: '  foo  ,  bar  ' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(imageAttributeRepository.create).toHaveBeenCalledWith({
      imageId: 'image-1',
      labelId: 'label-1',
      keywords: 'foo,bar',
    });
  });

  it('should return INVALID_LABEL_ID error for empty labelId', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await addAttribute(
      { imageId: 'image-1', labelId: '' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'INVALID_LABEL_ID' });
    expect(imageRepository.findById).not.toHaveBeenCalled();
  });

  it('should return INVALID_LABEL_ID error for whitespace-only labelId', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await addAttribute(
      { imageId: 'image-1', labelId: '   ' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'INVALID_LABEL_ID' });
  });

  it('should return IMAGE_NOT_FOUND error if image does not exist', async () => {
    const imageRepository = createMockImageRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await addAttribute(
      { imageId: 'nonexistent', labelId: 'label-1' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'IMAGE_NOT_FOUND' });
    expect(labelRepository.findById).not.toHaveBeenCalled();
  });

  it('should return LABEL_NOT_FOUND error if label does not exist', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const imageAttributeRepository = createMockImageAttributeRepository();

    const result = await addAttribute(
      { imageId: 'image-1', labelId: 'nonexistent' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'LABEL_NOT_FOUND' });
    expect(imageAttributeRepository.create).not.toHaveBeenCalled();
  });

  it('should return ALREADY_EXISTS error if attribute already exists', async () => {
    const imageRepository = createMockImageRepository();
    const labelRepository = createMockLabelRepository();
    const imageAttributeRepository = createMockImageAttributeRepository({
      findByImageAndLabel: vi.fn().mockResolvedValue(mockAttribute),
    });

    const result = await addAttribute(
      { imageId: 'image-1', labelId: 'label-1' },
      { imageRepository, labelRepository, imageAttributeRepository },
    );

    expect(result).toEqual({ success: false, error: 'ALREADY_EXISTS' });
    expect(imageAttributeRepository.create).not.toHaveBeenCalled();
  });
});
