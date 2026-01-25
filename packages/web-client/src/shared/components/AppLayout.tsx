import { useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconChartBar,
  IconCopy,
  IconDownload,
  IconFolder,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPhoto,
  IconTags,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';

interface AppLayoutProps {
  children: React.ReactNode;
  /** ヘッダーに表示する追加のアクション（例: ジョブステータスボタン） */
  headerActions?: React.ReactNode;
}

const navItems = [
  { label: 'ホーム', path: '/', icon: IconHome },
  { label: 'ギャラリー', path: '/gallery', icon: IconPhoto },
  { label: 'コレクション', path: '/collections', icon: IconFolder },
  { label: 'ラベル', path: '/labels', icon: IconTags },
  { label: '重複検出', path: '/duplicates', icon: IconCopy },
  { label: 'インポート', path: '/import', icon: IconDownload },
  { label: '統計', path: '/stats', icon: IconChartBar },
];

export function AppLayout({ children, headerActions }: AppLayoutProps) {
  const [opened, setOpened] = useState(true);
  const location = useLocation();

  return (
    <AppShell
      navbar={{
        width: opened ? 250 : 60,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Navbar p="xs">
        <Stack gap="xs" h="100%">
          <Group justify={opened ? 'space-between' : 'center'} p="xs">
            {opened && (
              <Title order={4} c="dimmed">
                Picstash
              </Title>
            )}
            <Group gap="xs">
              {headerActions}
              <ActionIcon
                variant="subtle"
                onClick={() => { setOpened(!opened); }}
                aria-label={opened ? 'サイドバーを折りたたむ' : 'サイドバーを展開'}
              >
                {opened
                  ? (
                      <IconLayoutSidebarLeftCollapse size={20} />
                    )
                  : (
                      <IconLayoutSidebarLeftExpand size={20} />
                    )}
              </ActionIcon>
            </Group>
          </Group>

          <Stack gap={4}>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                component={Link}
                to={item.path}
                label={opened ? item.label : undefined}
                leftSection={<item.icon size={20} />}
                active={location.pathname === item.path}
                aria-label={item.label}
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                }}
              />
            ))}
          </Stack>

          <div style={{ flex: 1 }} />

          {opened && (
            <Text size="xs" c="dimmed" ta="center" pb="xs">
              画像ライブラリ
            </Text>
          )}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
