import { SettingsPageView } from './SettingsPageView.js';
import { useSettingsPageViewProps } from './useSettingsPageViewProps.js';

/**
 * 設定ページ Container
 * useViewProps + View の統合
 */
export function SettingsPage() {
  const viewProps = useSettingsPageViewProps();
  return <SettingsPageView {...viewProps} />;
}
