export interface Label {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

export interface LabelRepository {
  create(input: CreateLabelInput): Promise<Label>;
  findById(id: string): Promise<Label | null>;
  findByName(name: string): Promise<Label | null>;
  findAll(): Promise<Label[]>;
  updateById(id: string, input: UpdateLabelInput): Promise<Label>;
  deleteById(id: string): Promise<Label>;
}
