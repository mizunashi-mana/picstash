import { Route, Routes } from 'react-router';
import { ArchiveImportPage } from '@/features/archive-import';
import {
  CollectionDetailPage,
  CollectionsPage,
  CollectionViewerPage,
} from '@/features/collections';
import { DuplicatesPage } from '@/features/duplicates';
import { ImageDetailPage } from '@/features/gallery/pages/ImageDetailPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { LabelsPage } from '@/features/labels';
import { StatsPage } from '@/features/stats';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/images/:id" element={<ImageDetailPage />} />
      <Route path="/labels" element={<LabelsPage />} />
      <Route path="/collections" element={<CollectionsPage />} />
      <Route path="/collections/:id" element={<CollectionDetailPage />} />
      <Route path="/collections/:id/view" element={<CollectionViewerPage />} />
      <Route path="/collections/:id/view/:imageId" element={<CollectionViewerPage />} />
      <Route path="/duplicates" element={<DuplicatesPage />} />
      <Route path="/archive-import" element={<ArchiveImportPage />} />
      <Route path="/stats" element={<StatsPage />} />
    </Routes>
  );
}
