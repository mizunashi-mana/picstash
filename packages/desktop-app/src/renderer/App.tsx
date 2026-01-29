import { JobStatusButton } from '@/features/jobs';
import { AppRoutes } from '@/routes';
import { AppLayout } from '@/shared/components/AppLayout';

export function App() {
  return (
    <AppLayout headerActions={<JobStatusButton />}>
      <AppRoutes />
    </AppLayout>
  );
}
