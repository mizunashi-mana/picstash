/* v8 ignore file -- Container: Hook と View を接続するだけなので Storybook テストでカバー */
import { UrlCrawlTabView } from '@/features/import/ui/UrlCrawlTabView';
import { useUrlCrawlTabViewProps } from '@/features/import/ui/useUrlCrawlTabViewProps';

export function UrlCrawlTab(): React.JSX.Element {
  const viewProps = useUrlCrawlTabViewProps();
  return <UrlCrawlTabView {...viewProps} />;
}
