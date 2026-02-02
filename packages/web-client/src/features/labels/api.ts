// Re-export from entities for backward compatibility within labels feature
export type { Label, CreateLabelInput, UpdateLabelInput } from '@/entities/label';
export {
  fetchLabels,
  fetchLabel,
  createLabel,
  updateLabel,
  deleteLabel,
} from '@/entities/label';
