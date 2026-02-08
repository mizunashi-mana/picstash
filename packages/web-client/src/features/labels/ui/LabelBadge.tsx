/* v8 ignore file -- UI コンポーネント: Storybook テストでカバー */
import { Badge } from '@mantine/core';
import type { Label } from '@picstash/api';

interface LabelBadgeProps {
  label: Label;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LabelBadge({ label, size = 'md' }: LabelBadgeProps) {
  const labelColor = label.color;

  return (
    <Badge
      size={size}
      color={labelColor ?? 'gray'}
      variant="light"
      style={
        labelColor !== null
          ? {
              backgroundColor: `${labelColor}20`,
              color: labelColor,
              borderColor: labelColor,
            }
          : undefined
      }
    >
      {label.name}
    </Badge>
  );
}
