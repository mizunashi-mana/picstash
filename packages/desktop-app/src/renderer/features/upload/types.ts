export interface Image {
  id: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}
