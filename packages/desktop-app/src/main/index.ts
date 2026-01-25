import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow } from 'electron';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(currentDir, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 開発中は仮の HTML を読み込む（src/renderer から直接）
  const htmlPath = path.join(currentDir, '../../src/renderer/index.html');
  void mainWindow.loadFile(htmlPath);
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
