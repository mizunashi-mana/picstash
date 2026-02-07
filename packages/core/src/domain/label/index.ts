// Entity (Command Model)
// Note: LabelEntity is simple enough to use for both commands and queries
export type {
  LabelEntity,
  CreateLabelInput,
  UpdateLabelInput,
} from './LabelEntity.js';

// Utilities
export {
  LabelName,
  LABEL_NAME_MAX_LENGTH,
  type LabelNameValidationError,
} from './LabelName.js';
