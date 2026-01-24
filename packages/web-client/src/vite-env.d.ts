// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Required for Vite type definitions
/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
