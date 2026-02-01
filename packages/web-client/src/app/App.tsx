import { AppRoutes } from '@/app/routes';
import { JobStatusButton } from '@/features/jobs';
import { AppLayout } from '@/shared';

export function App() {
  return (
    <AppLayout headerActions={<JobStatusButton />}>
      <AppRoutes />
    </AppLayout>
  );
}
