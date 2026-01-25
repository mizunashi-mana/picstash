/**
 * Label entity
 */
export interface Label {
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
