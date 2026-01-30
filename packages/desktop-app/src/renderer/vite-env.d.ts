// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Required for Vite type definitions
/// <reference types="vite/client" />

import type { PicstashAPI } from '@desktop-app/shared/types.js';

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare global {
  interface Window {
    picstash?: PicstashAPI;
  }
}
