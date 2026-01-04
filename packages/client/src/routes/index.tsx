import { Route, Routes } from 'react-router';
import { ImageDetailPage } from '@/features/gallery/pages/ImageDetailPage';
import { HomePage } from '@/features/home/pages/HomePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/images/:id" element={<ImageDetailPage />} />
    </Routes>
  );
}
