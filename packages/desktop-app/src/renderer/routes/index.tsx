import { Route, Routes } from 'react-router';
import {
  CollectionDetailPage,
  CollectionsPage,
  CollectionViewerPage,
} from '@/features/collections';
import { DuplicatesPage } from '@/features/duplicates';
import { GalleryPage, ImageDetailPage } from '@/features/gallery';
import { HomePage } from '@/features/home';
import { ImportPage } from '@/features/import';
import { LabelsPage } from '@/features/labels';
import { SettingsPage } from '@/features/settings';
import { StatsPage } from '@/features/stats';

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
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
