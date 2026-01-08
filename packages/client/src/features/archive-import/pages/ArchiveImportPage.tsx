import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  deleteArchiveSession,
  getArchiveSession,
  uploadArchive,
} from '@/features/archive-import/api';
import { ArchiveDropzone } from '@/features/archive-import/components/ArchiveDropzone';
import { ArchivePreviewGallery } from '@/features/archive-import/components/ArchivePreviewGallery';

export function ArchiveImportPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Keep ref in sync with state for cleanup
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current != null) {
        deleteArchiveSession(sessionIdRef.current).catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, []);

  const uploadMutation = useMutation({
    mutationFn: uploadArchive,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
    },
  });

  const sessionQuery = useQuery({
    queryKey: ['archive-session', sessionId],
    queryFn: async () => getArchiveSession(sessionId!),
    enabled: sessionId != null,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArchiveSession,
    onSuccess: () => {
      setSessionId(null);
    },
  });

  const handleDrop = (files: File[]) => {
    const file = files[0];
    if (file != null) {
      uploadMutation.mutate(file);
    }
  };

  const handleClose = () => {
    if (sessionId != null) {
      deleteMutation.mutate(sessionId);
    }
  };

  const session = sessionQuery.data;

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Title order={1}>Archive Import</Title>
          <Text c="dimmed">ZIP/RAR ファイルから画像をプレビュー</Text>
        </Stack>

        {sessionId == null
          ? (
              <ArchiveDropzone
                onDrop={handleDrop}
                isPending={uploadMutation.isPending}
                isError={uploadMutation.isError}
                errorMessage={uploadMutation.error?.message}
              />
            )
          : (
              <Stack gap="md">
                {sessionQuery.isLoading
                  ? (
                      <Stack align="center" py="xl">
                        <Loader size="lg" />
                        <Text c="dimmed">Loading archive contents...</Text>
                      </Stack>
                    )
                  : sessionQuery.error
                    ? (
                        <Alert color="red" title="Error">
                          {sessionQuery.error.message}
                        </Alert>
                      )
                    : session
                      ? (
                          <>
                            <Group justify="space-between" align="center">
                              <Group gap="sm">
                                <Text fw={500}>{session.filename}</Text>
                                <Badge variant="light">
                                  {session.archiveType.toUpperCase()}
                                </Badge>
                                <Text size="sm" c="dimmed">
                                  {session.imageCount}
                                  {' '}
                                  images
                                </Text>
                              </Group>
                              <Button
                                variant="outline"
                                color="red"
                                onClick={handleClose}
                                loading={deleteMutation.isPending}
                              >
                                Close
                              </Button>
                            </Group>
                            <ArchivePreviewGallery
                              sessionId={session.sessionId}
                              images={session.images}
                            />
                          </>
                        )
                      : null}
              </Stack>
            )}
      </Stack>
    </Container>
  );
}
