import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Indicator,
  Popover,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLoader2, IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { Link } from 'react-router';
import styles from './JobStatusButton.module.css';
import type { Job } from '@picstash/api';
import { useJobs } from '@/features/jobs/context';
import { getJobTypeName, getImageId } from '@/features/jobs/utils';

function JobProgressItem({ job }: { job: Job }) {
  const { markAsRead } = useJobs();
  const imageId = getImageId(job);

  const statusIcon
    = job.status === 'active' || job.status === 'waiting'
      ? (
          <IconLoader2 size={16} className={styles.spin} />
        )
      : job.status === 'completed'
        ? (
            <IconCheck size={16} color="green" />
          )
        : (
            <IconX size={16} color="red" />
          );

  const statusColor
    = job.status === 'completed'
      ? 'green'
      : job.status === 'failed'
        ? 'red'
        : job.status === 'active'
          ? 'blue'
          : 'gray';

  const content = (
    <Box p="xs">
      <Group gap="xs" wrap="nowrap">
        {statusIcon}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
            {getJobTypeName(job.type)}
          </Text>
          {imageId !== undefined && (
            <Text size="xs" c="dimmed" truncate>
              画像
              {' '}
              {imageId.slice(0, 8)}
              ...
            </Text>
          )}
        </Box>
        <Badge size="xs" color={statusColor} variant="light">
          {job.status === 'waiting'
            ? '待機中'
            : job.status === 'active'
              ? `${job.progress}%`
              : job.status === 'completed'
                ? '完了'
                : 'エラー'}
        </Badge>
      </Group>
      {(job.status === 'active' || job.status === 'waiting') && (
        <Progress value={job.progress} size="xs" mt="xs" color="blue" animated />
      )}
      {job.status === 'failed' && job.error !== undefined && (
        <Text size="xs" c="red" mt="xs">
          {job.error}
        </Text>
      )}
    </Box>
  );

  // 完了したジョブは詳細ページへのリンクにする
  if (job.status === 'completed' && imageId !== undefined) {
    return (
      <Box
        component={Link}
        to={`/images/${imageId}`}
        onClick={() => {
          markAsRead(job.id);
        }}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          borderRadius: 'var(--mantine-radius-sm)',
        }}
        className={styles.hoverHighlight}
      >
        {content}
      </Box>
    );
  }

  return content;
}

export function JobStatusButton() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { activeJobs, recentCompletedJobs, activeJobCount } = useJobs();

  const allJobs = [...activeJobs, ...recentCompletedJobs];
  const hasJobs = allJobs.length > 0;
  const hasUnread = recentCompletedJobs.length > 0;

  return (
    <Popover
      opened={opened}
      onChange={(o) => {
        if (!o) close();
      }}
      position="bottom-end"
      width={320}
      shadow="md"
    >
      <Popover.Target>
        <Indicator
          disabled={!hasUnread && activeJobCount === 0}
          processing={activeJobCount > 0}
          label={activeJobCount > 0 ? activeJobCount : undefined}
          size={16}
          color={activeJobCount > 0 ? 'blue' : 'green'}
        >
          <ActionIcon
            variant={hasJobs ? 'light' : 'subtle'}
            color={activeJobCount > 0 ? 'blue' : 'gray'}
            onClick={toggle}
            aria-label="ジョブ状況"
          >
            {activeJobCount > 0
              ? (
                  <IconLoader2 size={20} className={styles.spin} />
                )
              : (
                  <IconClock size={20} />
                )}
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Text fw={500} size="sm">
            ジョブ状況
          </Text>
        </Box>

        {allJobs.length === 0
          ? (
              <Box p="md">
                <Text size="sm" c="dimmed" ta="center">
                  実行中のジョブはありません
                </Text>
              </Box>
            )
          : (
              <Stack gap={0}>
                {activeJobs.length > 0 && (
                  <>
                    <Box px="sm" py="xs" bg="gray.0">
                      <Text size="xs" c="dimmed" fw={500}>
                        実行中
                      </Text>
                    </Box>
                    {activeJobs.map(job => (
                      <JobProgressItem key={job.id} job={job} />
                    ))}
                  </>
                )}
                {recentCompletedJobs.length > 0 && (
                  <>
                    <Box px="sm" py="xs" bg="gray.0">
                      <Text size="xs" c="dimmed" fw={500}>
                        完了
                      </Text>
                    </Box>
                    {recentCompletedJobs.map(job => (
                      <JobProgressItem key={job.id} job={job} />
                    ))}
                  </>
                )}
              </Stack>
            )}
      </Popover.Dropdown>
    </Popover>
  );
}
