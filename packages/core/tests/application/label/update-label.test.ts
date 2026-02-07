import { describe, expect, it, vi } from 'vitest';
import { updateLabel } from '@/application/label/update-label.js';
import type {
  LabelEntity,
  LabelRepository,
  UpdateLabelInput,
} from '@/application/ports/label-repository.js';

const existingLabel: LabelEntity = {
  id: 'label-1',
  name: 'Original Name',
  color: '#000000',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockLabelRepository(
  overrides: Partial<LabelRepository> = {},
): LabelRepository {
  return {
    findById: vi.fn().mockResolvedValue(existingLabel),
    findByName: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    updateById: vi
      .fn()
      .mockImplementation(async (id: string, input: UpdateLabelInput) => ({
        ...existingLabel,
        id,
        name: input.name ?? existingLabel.name,
        color: input.color ?? existingLabel.color,
        updatedAt: new Date(),
      })),
    deleteById: vi.fn().mockResolvedValue(undefined),
    findAllWithEmbedding: vi.fn().mockResolvedValue([]),
    findIdsWithoutEmbedding: vi.fn().mockResolvedValue([]),
    updateEmbedding: vi.fn().mockResolvedValue(undefined),
    clearAllEmbeddings: vi.fn().mockResolvedValue(undefined),
    countWithEmbedding: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe('updateLabel', () => {
  it('should update label name successfully', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await updateLabel(
      'label-1',
      { name: 'New Name' },
      { labelRepository },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.label.name).toBe('New Name');
    }
    expect(labelRepository.updateById).toHaveBeenCalledWith('label-1', {
      name: 'New Name',
      color: undefined,
    });
  });

  it('should update label color successfully', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await updateLabel(
      'label-1',
      { color: '#ff0000' },
      { labelRepository },
    );

    expect(result.success).toBe(true);
    expect(labelRepository.updateById).toHaveBeenCalledWith('label-1', {
      name: undefined,
      color: '#ff0000',
    });
  });

  it('should update both name and color', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await updateLabel(
      'label-1',
      { name: 'Updated', color: '#00ff00' },
      { labelRepository },
    );

    expect(result.success).toBe(true);
    expect(labelRepository.updateById).toHaveBeenCalledWith('label-1', {
      name: 'Updated',
      color: '#00ff00',
    });
  });

  it('should trim name and color', async () => {
    const labelRepository = createMockLabelRepository();

    await updateLabel(
      'label-1',
      { name: '  Trimmed  ', color: '  #aabbcc  ' },
      { labelRepository },
    );

    expect(labelRepository.updateById).toHaveBeenCalledWith('label-1', {
      name: 'Trimmed',
      color: '#aabbcc',
    });
  });

  it('should return NOT_FOUND error if label does not exist', async () => {
    const labelRepository = createMockLabelRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await updateLabel(
      'nonexistent',
      { name: 'New Name' },
      { labelRepository },
    );

    expect(result).toEqual({ success: false, error: 'NOT_FOUND' });
    expect(labelRepository.updateById).not.toHaveBeenCalled();
  });

  it('should return EMPTY_NAME error for empty name', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await updateLabel(
      'label-1',
      { name: '' },
      { labelRepository },
    );

    expect(result).toEqual({ success: false, error: 'EMPTY_NAME' });
    expect(labelRepository.updateById).not.toHaveBeenCalled();
  });

  it('should return EMPTY_NAME error for whitespace-only name', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await updateLabel(
      'label-1',
      { name: '   ' },
      { labelRepository },
    );

    expect(result).toEqual({ success: false, error: 'EMPTY_NAME' });
  });

  it('should return NAME_TOO_LONG error for very long name', async () => {
    const labelRepository = createMockLabelRepository();
    const longName = 'a'.repeat(101);

    const result = await updateLabel(
      'label-1',
      { name: longName },
      { labelRepository },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('NAME_TOO_LONG');
      expect(result).toHaveProperty('maxLength', 100);
    }
  });

  it('should return DUPLICATE_NAME error if name is taken by another label', async () => {
    const anotherLabel: LabelEntity = {
      id: 'label-2',
      name: 'Taken Name',
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const labelRepository = createMockLabelRepository({
      findByName: vi.fn().mockResolvedValue(anotherLabel),
    });

    const result = await updateLabel(
      'label-1',
      { name: 'Taken Name' },
      { labelRepository },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('DUPLICATE_NAME');
      expect(result).toHaveProperty('name', 'Taken Name');
    }
  });

  it('should allow updating to the same name (self)', async () => {
    const labelRepository = createMockLabelRepository({
      findByName: vi.fn().mockResolvedValue(existingLabel),
    });

    const result = await updateLabel(
      'label-1',
      { name: 'Original Name' },
      { labelRepository },
    );

    expect(result.success).toBe(true);
    expect(labelRepository.updateById).toHaveBeenCalled();
  });

  it('should allow updating only color without name validation', async () => {
    const labelRepository = createMockLabelRepository();

    const result = await updateLabel(
      'label-1',
      { color: '#ffffff' },
      { labelRepository },
    );

    expect(result.success).toBe(true);
    expect(labelRepository.findByName).not.toHaveBeenCalled();
  });
});
