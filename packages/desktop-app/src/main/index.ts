import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow } from 'electron';
import { coreManager } from './core-manager.js';
import { registerIpcHandlers } from './ipc-handlers.js';
import { storageManager } from './storage-manager.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// 開発モードかどうかを判定
// eslint-disable-next-line @typescript-eslint/dot-notation -- NODE_ENV は予約語ではないのでブラケット記法が必要
const isDev = process.env['NODE_ENV'] === 'development';

// 開発サーバーの URL
const DEV_SERVER_URL = 'http://localhost:5174';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(currentDir, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // NOTE: sandbox: false は preload で process.versions にアクセスするため。
      // 将来的に IPC 経由でバージョン情報を取得するように変更し、sandbox: true に移行予定。
      sandbox: false,
    },
  });

  if (isDev) {
    // 開発モード: Vite dev server を読み込む
    void mainWindow.loadURL(DEV_SERVER_URL);
    // DevTools を開く
    mainWindow.webContents.openDevTools();
  }
  else {
    // 本番モード: ビルド済み HTML を読み込む
    // NOTE: file:// プロトコルでは /api への fetch が動作しない。
    // 後続タスク（T3〜T6）で @picstash/core をメインプロセスで直接利用する形に移行予定。
    const htmlPath = path.join(currentDir, '../renderer/index.html');
    void mainWindow.loadFile(htmlPath);
  }
}

void app.whenReady().then(async () => {
  // 設定を読み込み
  await storageManager.loadConfig();

  // ストレージパスが設定済みなら @picstash/core を初期化
  const storagePath = storageManager.getPath();
  if (storagePath !== null) {
    await coreManager.initialize(storagePath);
  }

  // IPC ハンドラを登録
  registerIpcHandlers();

  createWindow();

  app.on('activate', () => {
    // macOS: ドックアイコンクリック時にウィンドウがなければ再作成
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  // @picstash/core のリソースを解放
  void coreManager.teardown();
});

app.on('window-all-closed', () => {
  // macOS 以外ではすべてのウィンドウを閉じたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
