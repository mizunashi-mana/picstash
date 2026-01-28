import { ipcMain } from 'electron';
import { storageManager } from './storage-manager.js';
import { IPC_CHANNELS } from '../shared/types.js';
import type { SaveFileOptions } from '../shared/types.js';

/**
 * IPC ハンドラを登録する
 */
export function registerIpcHandlers(): void {
  // ファイル読み取り
  ipcMain.handle(IPC_CHANNELS.STORAGE_READ_FILE, async (_event, relativePath: string) => {
    const buffer = await storageManager.readFile(relativePath);
    // ArrayBuffer として返す（レンダラープロセスで使用可能）
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  });

  // ファイル保存
  ipcMain.handle(IPC_CHANNELS.STORAGE_SAVE_FILE, async (_event, data: ArrayBuffer, options: SaveFileOptions) => {
    const buffer = Buffer.from(data);
    return await storageManager.saveFile(buffer, options);
  });

  // ファイル削除
  ipcMain.handle(IPC_CHANNELS.STORAGE_DELETE_FILE, async (_event, relativePath: string) => {
    await storageManager.deleteFile(relativePath);
  });

  // ファイル存在確認
  ipcMain.handle(IPC_CHANNELS.STORAGE_FILE_EXISTS, async (_event, relativePath: string) => {
    return await storageManager.fileExists(relativePath);
  });

  // ファイルサイズ取得
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_FILE_SIZE, async (_event, relativePath: string) => {
    return await storageManager.getFileSize(relativePath);
  });

  // ストレージパス取得
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_PATH, (_event) => {
    return storageManager.getPath();
  });

  // ストレージパス設定
  ipcMain.handle(IPC_CHANNELS.STORAGE_SET_PATH, async (_event, path: string) => {
    await storageManager.setPath(path);
  });

  // ストレージパス選択（ダイアログ）
  ipcMain.handle(IPC_CHANNELS.STORAGE_SELECT_PATH, async (_event) => {
    return await storageManager.selectPath();
  });

  // ストレージ初期化確認
  ipcMain.handle(IPC_CHANNELS.STORAGE_IS_INITIALIZED, (_event) => {
    return storageManager.isInitialized();
  });
}
