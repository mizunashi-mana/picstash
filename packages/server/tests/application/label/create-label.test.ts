import { describe, expect, it, vi } from 'vitest';
import { createLabel } from '@/application/label/create-label.js';
import type {
  CreateLabelInput,
  Label,
  LabelRepository,
} from '@/application/ports/label-repository.js';

function createMockLabelRepository(
  overrides: Partial<LabelRepository> = {},
): LabelRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByName: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(async (input: CreateLabelInput) => ({
      id: 'new-label-id',
      name: input.name,
      color: input.color ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    updateById: vi.fn().mockResolvedValue(null),
    deleteById: vi.fn().mockResolvedValue(undefined),
    findAllWithEmbedding: vi.fn().mockResolvedValue([]),
    findIdsWithoutEmbedding: vi.fn().mockResolvedValue([]),
    updateEmbedding: vi.fn().mockResolvedValue(undefined),
    clearAllEmbeddings: vi.fn().mockResolvedValue(undefined),
    countWithEmbedding: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe('createLabel', () => {
  it('should create a label successfully', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await createLabel(
      { name: 'Test Label', color: '#ff0000' },
      { labelRepository },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.label.name).toBe('Test Label');
      expect(result.label.color).toBe('#ff0000');
    }
    expect(labelRepository.create).toHaveBeenCalledWith({
      name: 'Test Label',
      color: '#ff0000',
    });
  });

  it('should trim the label name', async () => {
    const labelRepository = createMockLabelRepository();

    await createLabel({ name: '  Trimmed Name  ' }, { labelRepository });

    expect(labelRepository.create).toHaveBeenCalledWith({
      name: 'Trimmed Name',
      color: undefined,
    });
  });

  it('should trim the color if provided', async () => {
    const labelRepository = createMockLabelRepository();

    await createLabel(
      { name: 'Label', color: '  #00ff00  ' },
      { labelRepository },
    );

    expect(labelRepository.create).toHaveBeenCalledWith({
      name: 'Label',
      color: '#00ff00',
    });
  });

  it('should return EMPTY_NAME error for empty name', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await createLabel({ name: '' }, { labelRepository });

    expect(result).toEqual({ success: false, error: 'EMPTY_NAME' });
    expect(labelRepository.create).not.toHaveBeenCalled();
  });

  it('should return EMPTY_NAME error for whitespace-only name', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await createLabel({ name: '   ' }, { labelRepository });

    expect(result).toEqual({ success: false, error: 'EMPTY_NAME' });
  });

  it('should return NAME_TOO_LONG error for very long name', async () => {
    const labelRepository = createMockLabelRepository();
    const longName = 'a'.repeat(101);

    const result = await createLabel({ name: longName }, { labelRepository });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('NAME_TOO_LONG');
      expect(result).toHaveProperty('maxLength', 100);
    }
  });

  it('should return DUPLICATE_NAME error if name already exists', async () => {
    const existingLabel: Label = {
      id: 'existing-id',
      name: 'Existing Label',
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const labelRepository = createMockLabelRepository({
      findByName: vi.fn().mockResolvedValue(existingLabel),
    });

    const result = await createLabel(
      { name: 'Existing Label' },
      { labelRepository },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('DUPLICATE_NAME');
      expect(result).toHaveProperty('name', 'Existing Label');
    }
    expect(labelRepository.create).not.toHaveBeenCalled();
  });

  it('should create label without color', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await createLabel({ name: 'No Color' }, { labelRepository });

    expect(result.success).toBe(true);
    expect(labelRepository.create).toHaveBeenCalledWith({
      name: 'No Color',
      color: undefined,
    });
  });
});
