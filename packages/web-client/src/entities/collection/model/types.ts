export interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithCount extends Collection {
  imageCount: number;
}

export interface CollectionImage {
  id: string;
  imageId: string;
  order: number;
  title: string;
  thumbnailPath: string | null;
}

export interface CollectionWithImages extends Collection {
  images: CollectionImage[];
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  coverImageId?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  coverImageId?: string | null;
}

export interface AddImageInput {
  imageId: string;
  order?: number;
}

export interface UpdateOrderInput {
  orders: Array<{
    imageId: string;
    order: number;
  }>;
}
