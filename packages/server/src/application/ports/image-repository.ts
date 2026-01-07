export interface Image {
  id: string;
  filename: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImageInput {
  filename: string;
  path: string;
  thumbnailPath?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UpdateImageInput {
  description?: string | null;
}

export interface ImageRepository {
  create(input: CreateImageInput): Promise<Image>;
  findById(id: string): Promise<Image | null>;
  findAll(): Promise<Image[]>;
  search(query: string): Promise<Image[]>;
  updateById(id: string, input: UpdateImageInput): Promise<Image>;
  deleteById(id: string): Promise<Image>;
}
