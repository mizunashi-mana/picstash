export interface Image {
  id: string;
  filename: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
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

export interface ImageRepository {
  create(input: CreateImageInput): Promise<Image>;
  findById(id: string): Promise<Image | null>;
  findAll(): Promise<Image[]>;
  deleteById(id: string): Promise<Image>;
}
