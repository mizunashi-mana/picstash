import { Route, Routes } from 'react-router';
import { ArchiveImportPage } from '@/features/archive-import';
import { ImageDetailPage } from '@/features/gallery/pages/ImageDetailPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { LabelsPage } from '@/features/labels';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/images/:id" element={<ImageDetailPage />} />
      <Route path="/labels" element={<LabelsPage />} />
      <Route path="/archive-import" element={<ArchiveImportPage />} />
    </Routes>
  );
}
