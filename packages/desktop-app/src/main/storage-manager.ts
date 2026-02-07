import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve, sep } from 'node:path';
import { app, dialog } from 'electron';
import type { FileCategory, SaveFileOptions, SaveFileResult } from '@desktop-app/shared/types.js';

/**
 * ライブラリディレクトリの拡張子
 */
const LIBRARY_EXTENSION = '.pstlib';

/**
 * 新規作成時のデフォルトライブラリ名
 */
const DEFAULT_LIBRARY_NAME = `library${LIBRARY_EXTENSION}`;

/**
 * パスがライブラリディレクトリかどうかを判定
 */
function isLibraryDirectory(path: string): boolean {
  return extname(path).toLowerCase() === LIBRARY_EXTENSION;
}

/**
 * 設定ファイルの構造
 */
interface StorageConfig {
  storagePath: string | null;
}

/**
 * 値が StorageConfig かどうかを判定する型ガード
 */
function isStorageConfig(value: unknown): value is StorageConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('storagePath' in value)) {
    return false;
  }
  const storagePath = value.storagePath;
  return storagePath === null || typeof storagePath === 'string';
}

/**
 * ストレージマネージャー
 * ファイルシステムへのアクセスとストレージパスの管理を担当
 */
export class StorageManager {
  private storagePath: string | null = null;
  private readonly configPath: string;

  constructor() {
    // 設定ファイルはユーザーデータディレクトリに保存
    this.configPath = join(app.getPath('userData'), 'storage-config.json');
  }

  /**
   * 設定を読み込む
   */
  async loadConfig(): Promise<void> {
    try {
      const configData = await readFile(this.configPath, 'utf-8');
      const parsed: unknown = JSON.parse(configData);
      if (isStorageConfig(parsed)) {
        this.storagePath = parsed.storagePath;
      }
      else {
        this.storagePath = null;
      }
    }
    catch {
      // 設定ファイルが存在しない場合は無視
      this.storagePath = null;
    }
  }

  /**
   * 設定を保存する
   */
  private async saveConfig(): Promise<void> {
    const config: StorageConfig = {
      storagePath: this.storagePath,
    };
    await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * ストレージが初期化済みかどうかを確認
   */
  isInitialized(): boolean {
    return this.storagePath !== null;
  }

  /**
   * 現在のストレージパスを取得
   */
  getPath(): string | null {
    return this.storagePath;
  }

  /**
   * ストレージパスを設定
   */
  async setPath(path: string): Promise<void> {
    // ディレクトリが存在することを確認
    await access(path);
    this.storagePath = path;
    await this.saveConfig();
  }

  /**
   * ライブラリディレクトリを初期化（必要なサブディレクトリを作成）
   */
  private async initializeLibraryDirectory(libraryPath: string): Promise<void> {
    await mkdir(libraryPath, { recursive: true });
    await mkdir(join(libraryPath, 'storage', 'originals'), { recursive: true });
    await mkdir(join(libraryPath, 'storage', 'thumbnails'), { recursive: true });
  }

  /**
   * フォルダ選択ダイアログを表示
   *
   * - .pstlib ディレクトリが選択された場合: 既存ライブラリとして開く
   * - それ以外のディレクトリが選択された場合: library.pstlib を作成して新規ライブラリとして開く
   */
  async selectPath(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'ライブラリフォルダを選択',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: '選択',
      message: '既存の .pstlib フォルダを選択するか、新規ライブラリを作成するフォルダを選択してください',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedPath = result.filePaths[0];
    if (selectedPath === undefined) {
      return null;
    }

    let libraryPath: string;

    if (isLibraryDirectory(selectedPath)) {
      // .pstlib ディレクトリが選択された場合: そのまま使用
      libraryPath = selectedPath;
    }
    else {
      // 通常ディレクトリが選択された場合: library.pstlib を作成
      libraryPath = join(selectedPath, DEFAULT_LIBRARY_NAME);
    }

    // ライブラリディレクトリを初期化（既存の場合は何もしない）
    await this.initializeLibraryDirectory(libraryPath);
    await this.setPath(libraryPath);

    return libraryPath;
  }

  /**
   * ストレージパスが設定済みであることを確認
   * @throws ストレージパスが未設定の場合
   */
  private ensureInitialized(): string {
    if (this.storagePath === null) {
      throw new Error('Storage path is not initialized');
    }
    return this.storagePath;
  }

  /**
   * カテゴリのパスを取得
   * .pstlib ディレクトリ内の storage/ サブディレクトリを経由
   */
  private getCategoryPath(category: FileCategory): string {
    const basePath = this.ensureInitialized();
    return join(basePath, 'storage', category);
  }

  /**
   * 拡張子を検証する
   * @throws 無効な拡張子の場合
   */
  private validateExtension(extension: string): void {
    // 拡張子の検証: 先頭がドットで、その後に英数字のみを許可
    if (!/^\.[a-zA-Z0-9]+$/.test(extension)) {
      throw new Error('Invalid file extension');
    }
  }

  /**
   * UUID ベースのファイル名を生成
   */
  private generateFilename(extension: string): string {
    this.validateExtension(extension);
    const uuid = randomUUID();
    return `${uuid}${extension}`;
  }

  /**
   * ディレクトリを作成（再帰的）
   */
  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  /**
   * ファイル名をサニタイズ（パストラバーサル攻撃防止）
   */
  private sanitizeFilename(filename: string): string {
    return basename(filename);
  }

  /**
   * 相対パスを検証して絶対パスに変換
   * @throws パストラバーサルが検出された場合
   */
  private resolveAndValidatePath(relativePath: string): string {
    const basePath = this.ensureInitialized();
    const absolutePath = resolve(basePath, relativePath);
    const normalizedBasePath = resolve(basePath);

    // ストレージパス内に収まっていることを確認（Windows/POSIX 両対応）
    if (!absolutePath.startsWith(normalizedBasePath + sep) && absolutePath !== normalizedBasePath) {
      throw new Error('Path traversal detected: path escapes storage directory');
    }

    return absolutePath;
  }

  /**
   * ファイルを読み取る
   */
  async readFile(relativePath: string): Promise<Buffer> {
    const filePath = this.resolveAndValidatePath(relativePath);
    return await readFile(filePath);
  }

  /**
   * ファイルを保存する
   */
  async saveFile(buffer: Buffer, options: SaveFileOptions): Promise<SaveFileResult> {
    const categoryPath = this.getCategoryPath(options.category);
    await this.ensureDirectory(categoryPath);

    const filename = options.filename !== undefined
      ? this.sanitizeFilename(options.filename)
      : this.generateFilename(options.extension);
    const filePath = join(categoryPath, filename);

    try {
      await writeFile(filePath, buffer);
    }
    catch (error) {
      // エラー時は部分的に書き込まれたファイルを削除
      await unlink(filePath).catch(() => {
        // クリーンアップのエラーは無視
      });
      throw error;
    }

    return {
      filename,
      path: `storage/${options.category}/${filename}`,
    };
  }

  /**
   * ファイルを削除する
   */
  async deleteFile(relativePath: string): Promise<void> {
    const filePath = this.resolveAndValidatePath(relativePath);
    await unlink(filePath);
  }

  /**
   * ファイルの存在を確認する
   */
  async fileExists(relativePath: string): Promise<boolean> {
    const filePath = this.resolveAndValidatePath(relativePath);
    try {
      await access(filePath);
      return true;
    }
    catch {
      return false;
    }
  }

  /**
   * ファイルサイズを取得する
   */
  async getFileSize(relativePath: string): Promise<number> {
    const filePath = this.resolveAndValidatePath(relativePath);
    const fileStat = await stat(filePath);
    return fileStat.size;
  }
}

// シングルトンインスタンス
export const storageManager = new StorageManager();
