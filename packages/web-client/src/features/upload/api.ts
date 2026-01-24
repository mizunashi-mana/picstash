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

interface ErrorResponse {
  message?: string;
}

export async function uploadImage(file: File): Promise<Image> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/images', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Upload failed');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as Image;
}
