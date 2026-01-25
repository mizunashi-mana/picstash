import { contextBridge } from 'electron';

// レンダラープロセスに公開する API
// 将来的に IPC 通信用のメソッドを追加する
const api = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
};

contextBridge.exposeInMainWorld('picstash', api);

// TypeScript の型定義用
declare global {
  interface Window {
    picstash: typeof api;
  }
}
