import { useState } from 'react';
import {
  Button,
  ColorInput,
  Group,
  Stack,
  TextInput,
} from '@mantine/core';
import type { Label, CreateLabelInput, UpdateLabelInput } from '@picstash/shared';

// Predefined color palette for auto-suggestion
const COLOR_PALETTE = [
  '#e03131', // Red
  '#f76707', // Orange
  '#fab005', // Yellow
  '#40c057', // Green
  '#15aabf', // Cyan
  '#228be6', // Blue
  '#7950f2', // Violet
  '#be4bdb', // Pink
  '#868e96', // Gray
];

// Default color when none can be determined
const DEFAULT_COLOR = '#228be6';

// Generate a suggested color based on label name
function suggestColor(name: string, existingColors: string[]): string {
  if (name.trim() === '') return COLOR_PALETTE[0] ?? DEFAULT_COLOR;

  // Simple hash based on name to get consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Filter out existing colors if possible
  const availableColors = COLOR_PALETTE.filter(
    c => !existingColors.includes(c),
  );
  const palette = availableColors.length > 0 ? availableColors : COLOR_PALETTE;

  const index = Math.abs(hash) % palette.length;
  return palette[index] ?? DEFAULT_COLOR;
}

interface LabelFormProps {
  mode: 'create' | 'edit';
  label?: Label;
  existingColors?: string[];
  onSubmit: (input: CreateLabelInput | UpdateLabelInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function LabelForm({
  mode,
  label,
  existingColors = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LabelFormProps) {
  const [name, setName] = useState(label?.name ?? '');
  const [color, setColor] = useState(label?.color ?? '');
  const [userSetColor, setUserSetColor] = useState(false);

  // Handle name change - auto-suggest color in create mode
  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === 'create' && !userSetColor && value !== '') {
      setColor(suggestColor(value, existingColors));
    }
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    setUserSetColor(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const colorValue = color !== '' ? color : undefined;

    if (mode === 'create') {
      onSubmit({ name: trimmedName, color: colorValue });
    }
    else {
      onSubmit({
        name: trimmedName !== '' ? trimmedName : undefined,
        color: colorValue,
      });
    }
  };

  const isValid = mode === 'create' ? name.trim() !== '' : true;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <TextInput
          label="ラベル名"
          placeholder="ラベル名を入力"
          value={name}
          onChange={(e) => { handleNameChange(e.currentTarget.value); }}
          required={mode === 'create'}
          disabled={isSubmitting}
        />

        <ColorInput
          label="カラー"
          placeholder="色を選択"
          value={color}
          onChange={handleColorChange}
          swatches={COLOR_PALETTE}
          format="hex"
          disabled={isSubmitting}
        />

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button
              variant="subtle"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid}
            loading={isSubmitting}
          >
            {mode === 'create' ? 'ラベルを作成' : 'ラベルを更新'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
