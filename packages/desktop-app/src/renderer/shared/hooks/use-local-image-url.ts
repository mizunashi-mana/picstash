import { useEffect, useState } from 'react';

/**
 * ローカルストレージの画像パスからデータ URL を取得するフック
 * @param path ストレージルートからの相対パス（null の場合は何もしない）
 * @returns データ URL（読み込み中または失敗時は null）
 */
export function useLocalImageUrl(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // パスが null の場合は URL をリセット
    if (path === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state when path changes to null
      setUrl(null);
      return;
    }

    // picstash API が存在しない場合は何もしない
    if (window.picstash === undefined) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    window.picstash.image
      .getDataUrl(path)
      .then((dataUrl: string) => {
        if (!cancelled) {
          setUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
