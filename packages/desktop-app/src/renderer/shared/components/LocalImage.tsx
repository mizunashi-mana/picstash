import { Box, Image, Skeleton, Text, type ImageProps } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { useLocalImageUrl } from '@/shared/hooks';

export interface LocalImageProps extends Omit<ImageProps, 'src'> {
  /** ストレージルートからの相対パス */
  path: string | null;
  /** 画像の代替テキスト */
  alt: string;
}

/**
 * ローカルストレージの画像を表示するコンポーネント
 * データ URL への変換を自動で行う
 */
export function LocalImage({ path, alt, w, h, ...props }: LocalImageProps) {
  const state = useLocalImageUrl(path);

  // path が null の場合はプレースホルダーを表示
  if (path === null) {
    return (
      <Box w={w} h={h} bg="gray.1" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <IconPhoto size={32} color="var(--mantine-color-gray-5)" />
      </Box>
    );
  }

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <Box w={w} h={h}>
        <Skeleton w="100%" h="100%" />
      </Box>
    );
  }

  if (state.status === 'error') {
    return (
      <Box w={w} h={h} bg="gray.1" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text size="xs" c="dimmed">Failed to load image</Text>
      </Box>
    );
  }

  return <Image src={state.url} alt={alt} w={w} h={h} {...props} />;
}
