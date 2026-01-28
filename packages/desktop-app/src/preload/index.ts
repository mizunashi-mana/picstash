import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@desktop-app/shared/types.js';
import type { PicstashAPI, SaveFileOptions, SaveFileResult, StorageAPI } from '@desktop-app/shared/types.js';

// Storage API の実装
const storageAPI: StorageAPI = {
  readFile: async (relativePath: string): Promise<ArrayBuffer> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_READ_FILE, relativePath);
  },

  saveFile: async (data: ArrayBuffer, options: SaveFileOptions): Promise<SaveFileResult> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_SAVE_FILE, data, options);
  },

  deleteFile: async (relativePath: string): Promise<void> => {
    await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_DELETE_FILE, relativePath);
  },

  fileExists: async (relativePath: string): Promise<boolean> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_FILE_EXISTS, relativePath);
  },

  getFileSize: async (relativePath: string): Promise<number> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET_FILE_SIZE, relativePath);
  },

  getPath: async (): Promise<string | null> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET_PATH);
  },

  setPath: async (path: string): Promise<void> => {
    await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_SET_PATH, path);
  },

  selectPath: async (): Promise<string | null> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_SELECT_PATH);
  },

  isInitialized: async (): Promise<boolean> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.STORAGE_IS_INITIALIZED);
  },
};

// レンダラープロセスに公開する API
const api: PicstashAPI = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  storage: storageAPI,
};

contextBridge.exposeInMainWorld('picstash', api);

// TypeScript の型定義用
declare global {
  interface Window {
    picstash: PicstashAPI;
  }
}
