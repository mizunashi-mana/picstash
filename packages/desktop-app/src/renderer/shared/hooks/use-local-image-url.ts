import { useEffect, useState } from 'react';

export type LocalImageUrlState
  = { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; url: string }
    | { status: 'error' };

/**
 * ローカルストレージの画像パスからデータ URL を取得するフック
 * @param path ストレージルートからの相対パス（null の場合は何もしない）
 * @returns 読み込み状態と URL
 */
export function useLocalImageUrl(path: string | null): LocalImageUrlState {
  const [state, setState] = useState<LocalImageUrlState>({ status: 'idle' });

  useEffect(() => {
    // パスが null の場合はリセット
    if (path === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state when path changes to null
      setState({ status: 'idle' });
      return;
    }

    // picstash API が存在しない場合はエラー
    if (window.picstash === undefined) {
      setState({ status: 'error' });
      return;
    }

    setState({ status: 'loading' });

    let cancelled = false;

    window.picstash.image
      .getDataUrl(path)
      .then((dataUrl: string) => {
        if (!cancelled) {
          setState({ status: 'success', url: dataUrl });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
