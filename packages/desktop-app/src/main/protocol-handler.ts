/* eslint-disable n/no-unsupported-features/node-builtins -- Response is available in Electron's main process */
import { protocol } from 'electron';
import { storageManager } from './storage-manager.js';

/**
 * picstash:// カスタムプロトコルを登録
 *
 * URL パターン:
 * - picstash://storage/{category}/{filename} → ストレージからファイルを読み込み
 *
 * 例:
 * - picstash://storage/thumbnails/abc123.jpg
 * - picstash://storage/originals/abc123.png
 */
export function registerCustomProtocol(): void {
  protocol.handle('picstash', async (request) => {
    const url = new URL(request.url);

    // picstash://storage/{path} の形式を解析
    if (url.host === 'storage') {
      const relativePath = url.pathname.slice(1); // 先頭の / を除去

      if (relativePath === '') {
        return new Response('Not Found', { status: 404 });
      }

      // ストレージが初期化されているか確認
      if (!storageManager.isInitialized()) {
        return new Response('Storage not initialized', { status: 503 });
      }

      try {
        // ファイルを読み込み
        const buffer = await storageManager.readFile(relativePath);

        // MIME タイプを拡張子から推定
        const mimeType = getMimeType(relativePath);

        // Buffer から ArrayBuffer を取得
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Node.js の Buffer.buffer は常に ArrayBuffer を返す
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer;

        return new Response(arrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': String(buffer.length),
            'Cache-Control': 'max-age=31536000', // 1年キャッシュ（ファイル名が UUID なので変更されない）
          },
        });
      }
      catch (error) {
        // ファイルが見つからない場合
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return new Response('Not Found', { status: 404 });
        }
        // その他のエラー
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  });
}

/**
 * 拡張子から MIME タイプを取得
 */
function getMimeType(filePath: string): string {
  const extension = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[extension] ?? 'application/octet-stream';
}

/**
 * カスタムプロトコルを特権スキームとして登録（app.whenReady の前に呼ぶ必要あり）
 */
export function registerProtocolPrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'picstash',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}
