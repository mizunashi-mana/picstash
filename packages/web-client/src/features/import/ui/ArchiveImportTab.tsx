import { ArchiveImportTabView } from '@/features/import/ui/ArchiveImportTabView';
import { useArchiveImportTabViewProps } from '@/features/import/ui/useArchiveImportTabViewProps';

export function ArchiveImportTab(): React.JSX.Element {
  const viewProps = useArchiveImportTabViewProps();
  return <ArchiveImportTabView {...viewProps} />;
}
