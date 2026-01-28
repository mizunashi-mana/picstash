/**
 * ファイルカテゴリ（保存先のサブディレクトリ）
 */
export type FileCategory = 'originals' | 'thumbnails';

/**
 * ファイル保存オプション
 */
export interface SaveFileOptions {
  category: FileCategory;
  extension: string;
  /** 明示的なファイル名。省略時は UUID を生成 */
  filename?: string;
}

/**
 * ファイル保存結果
 */
export interface SaveFileResult {
  filename: string;
  path: string;
}

/**
 * IPC チャンネル名の定義
 */
export const IPC_CHANNELS = {
  // ストレージ操作
  STORAGE_READ_FILE: 'storage:readFile',
  STORAGE_SAVE_FILE: 'storage:saveFile',
  STORAGE_DELETE_FILE: 'storage:deleteFile',
  STORAGE_FILE_EXISTS: 'storage:fileExists',
  STORAGE_GET_FILE_SIZE: 'storage:getFileSize',
  STORAGE_GET_PATH: 'storage:getPath',
  STORAGE_SET_PATH: 'storage:setPath',
  STORAGE_SELECT_PATH: 'storage:selectPath',
  STORAGE_IS_INITIALIZED: 'storage:isInitialized',
} as const;

/**
 * レンダラープロセスに公開する Storage API の型定義
 */
export interface StorageAPI {
  /**
   * ファイルを読み取る
   * @param relativePath ストレージルートからの相対パス
   * @returns ファイル内容の ArrayBuffer
   */
  readFile: (relativePath: string) => Promise<ArrayBuffer>;

  /**
   * ファイルを保存する
   * @param data 保存するデータ（ArrayBuffer）
   * @param options 保存オプション
   * @returns 保存結果
   */
  saveFile: (data: ArrayBuffer, options: SaveFileOptions) => Promise<SaveFileResult>;

  /**
   * ファイルを削除する
   * @param relativePath ストレージルートからの相対パス
   */
  deleteFile: (relativePath: string) => Promise<void>;

  /**
   * ファイルの存在を確認する
   * @param relativePath ストレージルートからの相対パス
   * @returns ファイルが存在すれば true
   */
  fileExists: (relativePath: string) => Promise<boolean>;

  /**
   * ファイルサイズを取得する
   * @param relativePath ストレージルートからの相対パス
   * @returns ファイルサイズ（バイト）
   */
  getFileSize: (relativePath: string) => Promise<number>;

  /**
   * 現在のストレージパスを取得する
   * @returns ストレージパス（未設定の場合は null）
   */
  getPath: () => Promise<string | null>;

  /**
   * ストレージパスを設定する
   * @param path 新しいストレージパス
   */
  setPath: (path: string) => Promise<void>;

  /**
   * フォルダ選択ダイアログを表示してストレージパスを選択する
   * @returns 選択されたパス（キャンセル時は null）
   */
  selectPath: () => Promise<string | null>;

  /**
   * ストレージが初期化済みかどうかを確認する
   * @returns 初期化済みなら true
   */
  isInitialized: () => Promise<boolean>;
}

/**
 * window.picstash の型定義
 */
export interface PicstashAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  storage: StorageAPI;
}
