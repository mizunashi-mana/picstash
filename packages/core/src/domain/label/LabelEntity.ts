/**
 * Label entity for command operations (create, update, delete)
 *
 * Labels are simple value objects, so the same type is used
 * for both command and query operations.
 */
export interface LabelEntity {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new label
 */
export interface CreateLabelInput {
  name: string;
  color?: string;
}

/**
 * Input for updating a label
 */
export interface UpdateLabelInput {
  name?: string;
  color?: string;
}
