import { AppRoutes } from '@/app/routes';
import { AppLayout } from '@/widgets/app-layout';
import { JobStatusButton } from '@/widgets/job-status';

export function App() {
  return (
    <AppLayout headerActions={<JobStatusButton />}>
      <AppRoutes />
    </AppLayout>
  );
}
