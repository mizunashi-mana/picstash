import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@desktop-app/shared/types.js';
import { storageManager } from './storage-manager.js';
import type { FileCategory, SaveFileOptions } from '@desktop-app/shared/types.js';

/**
 * 許可されたファイルカテゴリ
 */
const ALLOWED_CATEGORIES: readonly FileCategory[] = ['originals', 'thumbnails'];

/**
 * 相対パスの入力を検証
 * @throws 無効な入力の場合
 */
function validateRelativePath(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('relativePath must be a string');
  }
  if (value.length === 0) {
    throw new Error('relativePath must not be empty');
  }
}

/**
 * 値が FileCategory かどうかを判定
 */
function isFileCategory(value: unknown): value is FileCategory {
  return typeof value === 'string' && (ALLOWED_CATEGORIES as readonly string[]).includes(value);
}

/**
 * SaveFileOptions の入力を検証
 * @throws 無効な入力の場合
 */
function validateSaveFileOptions(value: unknown): asserts value is SaveFileOptions {
  if (typeof value !== 'object' || value === null) {
    throw new Error('options must be an object');
  }

  if (!('category' in value) || !isFileCategory(value.category)) {
    throw new Error(`options.category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (!('extension' in value) || typeof value.extension !== 'string') {
    throw new Error('options.extension must be a string');
  }

  if ('filename' in value && value.filename !== undefined && typeof value.filename !== 'string') {
    throw new Error('options.filename must be a string if provided');
  }
}

/**
 * ArrayBuffer の入力を検証
 * @throws 無効な入力の場合
 */
function validateArrayBuffer(value: unknown): asserts value is ArrayBuffer {
  if (!(value instanceof ArrayBuffer)) {
    throw new Error('data must be an ArrayBuffer');
  }
}

/**
 * パス（文字列）の入力を検証
 * @throws 無効な入力の場合
 */
function validatePath(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('path must be a string');
  }
  if (value.length === 0) {
    throw new Error('path must not be empty');
  }
}

/**
 * IPC ハンドラを登録する
 */
export function registerIpcHandlers(): void {
  // ファイル読み取り
  ipcMain.handle(IPC_CHANNELS.STORAGE_READ_FILE, async (_event, relativePath: unknown) => {
    validateRelativePath(relativePath);
    const buffer = await storageManager.readFile(relativePath);
    // Buffer から ArrayBuffer への変換
    // Buffer は ArrayBuffer の view である可能性があるため、
    // byteOffset と byteLength を使って正しい範囲を slice する
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  });

  // ファイル保存
  ipcMain.handle(IPC_CHANNELS.STORAGE_SAVE_FILE, async (_event, data: unknown, options: unknown) => {
    validateArrayBuffer(data);
    validateSaveFileOptions(options);
    const buffer = Buffer.from(data);
    return await storageManager.saveFile(buffer, options);
  });

  // ファイル削除
  ipcMain.handle(IPC_CHANNELS.STORAGE_DELETE_FILE, async (_event, relativePath: unknown) => {
    validateRelativePath(relativePath);
    await storageManager.deleteFile(relativePath);
  });

  // ファイル存在確認
  ipcMain.handle(IPC_CHANNELS.STORAGE_FILE_EXISTS, async (_event, relativePath: unknown) => {
    validateRelativePath(relativePath);
    return await storageManager.fileExists(relativePath);
  });

  // ファイルサイズ取得
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_FILE_SIZE, async (_event, relativePath: unknown) => {
    validateRelativePath(relativePath);
    return await storageManager.getFileSize(relativePath);
  });

  // ストレージパス取得
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_PATH, (_event) => {
    return storageManager.getPath();
  });

  // ストレージパス設定
  ipcMain.handle(IPC_CHANNELS.STORAGE_SET_PATH, async (_event, path: unknown) => {
    validatePath(path);
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
