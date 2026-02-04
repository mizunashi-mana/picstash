import { UrlCrawlTabView } from '@/features/import/ui/UrlCrawlTabView';
import { useUrlCrawlTabViewProps } from '@/features/import/ui/useUrlCrawlTabViewProps';

export function UrlCrawlTab(): React.JSX.Element {
  const viewProps = useUrlCrawlTabViewProps();
  return <UrlCrawlTabView {...viewProps} />;
}
