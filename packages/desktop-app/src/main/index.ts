import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow } from 'electron';

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
    const htmlPath = path.join(currentDir, '../renderer/index.html');
    void mainWindow.loadFile(htmlPath);
  }
}

void app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS: ドックアイコンクリック時にウィンドウがなければ再作成
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // macOS 以外ではすべてのウィンドウを閉じたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
