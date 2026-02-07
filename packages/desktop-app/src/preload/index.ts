import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@desktop-app/shared/types.js';
import type {
  GenericAPI,
  ImageAPI,
  ImageUploadInput,
  IpcApiRequest,
  IpcApiResponse,
  PicstashAPI,
  SaveFileOptions,
  SaveFileResult,
  StorageAPI,
  UploadResult,
} from '@desktop-app/shared/types.js';

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

// Image API の実装
const imageAPI: ImageAPI = {
  upload: async (input: ImageUploadInput): Promise<UploadResult> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.IMAGE_UPLOAD, input);
  },

  getDataUrl: async (relativePath: string): Promise<string> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.IMAGE_GET_DATA_URL, relativePath);
  },
};

// Generic API の実装（IPC 経由の汎用 API リクエスト）
const genericAPI: GenericAPI = {
  request: async (request: IpcApiRequest): Promise<IpcApiResponse> => {
    return await ipcRenderer.invoke(IPC_CHANNELS.API_REQUEST, request);
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
  image: imageAPI,
  api: genericAPI,
};

contextBridge.exposeInMainWorld('picstash', api);

// TypeScript の型定義用
declare global {
  interface Window {
    picstash: PicstashAPI;
  }
}
