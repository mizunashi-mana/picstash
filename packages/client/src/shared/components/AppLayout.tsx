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
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTags,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Home', path: '/', icon: IconHome },
  { label: 'Labels', path: '/labels', icon: IconTags },
];

export function AppLayout({ children }: AppLayoutProps) {
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
            <ActionIcon
              variant="subtle"
              onClick={() => setOpened(!opened)}
              aria-label={opened ? 'Collapse sidebar' : 'Expand sidebar'}
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
              Image Library
            </Text>
          )}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
