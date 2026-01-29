import { Box, Image, Skeleton, type ImageProps } from '@mantine/core';
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
  const url = useLocalImageUrl(path);

  if (url === null) {
    return (
      <Box w={w} h={h}>
        <Skeleton w="100%" h="100%" />
      </Box>
    );
  }

  return <Image src={url} alt={alt} w={w} h={h} {...props} />;
}
