import { Route, Routes } from 'react-router';
import {
  CollectionDetailPage,
  CollectionsPage,
  CollectionViewerPage,
} from '@/pages/collections';
import { DuplicatesPage } from '@/pages/duplicates';
import { GalleryPage } from '@/pages/gallery';
import { HomePage } from '@/pages/home';
import { ImageDetailPage } from '@/pages/image-detail';
import { ImportPage } from '@/pages/import';
import { LabelsPage } from '@/pages/labels';
import { StatsPage } from '@/pages/stats';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/images/:id" element={<ImageDetailPage />} />
      <Route path="/labels" element={<LabelsPage />} />
      <Route path="/collections" element={<CollectionsPage />} />
      <Route path="/collections/:id" element={<CollectionDetailPage />} />
      <Route path="/collections/:id/view" element={<CollectionViewerPage />} />
      <Route path="/collections/:id/view/:imageId" element={<CollectionViewerPage />} />
      <Route path="/duplicates" element={<DuplicatesPage />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/stats" element={<StatsPage />} />
    </Routes>
  );
}
