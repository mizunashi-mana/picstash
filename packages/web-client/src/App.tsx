import { JobStatusButton } from '@/features/jobs';
import { AppRoutes } from '@/routes';
import { AppLayout } from '@/shared';

export function App() {
  return (
    <AppLayout headerActions={<JobStatusButton />}>
      <AppRoutes />
    </AppLayout>
  );
}
