import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

// Electron のモック
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => join(tmpdir(), 'picstash-test')),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

// モック後にインポート（型は静的インポートで取得済み）
const { StorageManager } = await import(
  '../../../src/main/storage-manager.js',
);

describe('StorageManager', () => {
  let storageManager: InstanceType<typeof StorageManager>;
  let testStoragePath: string;
  let testConfigPath: string;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    testStoragePath = join(tmpdir(), `picstash-storage-test-${Date.now()}`);
    testConfigPath = join(tmpdir(), 'picstash-test');
    await mkdir(testStoragePath, { recursive: true });
    await mkdir(testConfigPath, { recursive: true });

    storageManager = new StorageManager();
    await storageManager.setPath(testStoragePath);
  });

  afterEach(async () => {
    // テスト用ディレクトリを削除
    await rm(testStoragePath, { recursive: true, force: true });
    await rm(join(testConfigPath, 'storage-config.json'), { force: true });
  });

  describe('パストラバーサル防止', () => {
    it('相対パスでの親ディレクトリアクセスを拒否する', async () => {
      await expect(
        storageManager.readFile('../etc/passwd'),
      ).rejects.toThrow('Path traversal detected');
    });

    it('複数の ../ を含むパスを拒否する', async () => {
      await expect(
        storageManager.readFile('originals/../../etc/passwd'),
      ).rejects.toThrow('Path traversal detected');
    });

    it.skipIf(sep !== '\\')('Windows 形式のパストラバーサルを拒否する (Windows のみ)', async () => {
      // このテストは Windows でのみ有効
      // POSIX システムではバックスラッシュは単なるファイル名文字として扱われる
      await expect(
        storageManager.readFile('..\\etc\\passwd'),
      ).rejects.toThrow('Path traversal detected');
    });

    it('正常な相対パスは許可する', async () => {
      // テストファイルを作成
      await mkdir(join(testStoragePath, 'originals'), { recursive: true });
      const testFilePath = join(testStoragePath, 'originals', 'test.txt');
      await writeFile(testFilePath, 'test content');

      const content = await storageManager.readFile('originals/test.txt');
      expect(content.toString()).toBe('test content');
    });
  });

  describe('拡張子バリデーション', () => {
    it('有効な拡張子でファイルを保存できる', async () => {
      const result = await storageManager.saveFile(Buffer.from('test'), {
        category: 'originals',
        extension: '.jpg',
      });

      expect(result.filename).toMatch(/^[a-f0-9-]+\.jpg$/);
      expect(result.path).toMatch(/^storage\/originals\/[a-f0-9-]+\.jpg$/);
    });

    it('無効な拡張子（ドットなし）を拒否する', async () => {
      await expect(
        storageManager.saveFile(Buffer.from('test'), {
          category: 'originals',
          extension: 'jpg',
        }),
      ).rejects.toThrow('Invalid file extension');
    });

    it('パストラバーサルを含む拡張子を拒否する', async () => {
      await expect(
        storageManager.saveFile(Buffer.from('test'), {
          category: 'originals',
          extension: '../.env',
        }),
      ).rejects.toThrow('Invalid file extension');
    });

    it('特殊文字を含む拡張子を拒否する', async () => {
      await expect(
        storageManager.saveFile(Buffer.from('test'), {
          category: 'originals',
          extension: '.jp<script>g',
        }),
      ).rejects.toThrow('Invalid file extension');
    });
  });

  describe('ファイル名サニタイズ', () => {
    it('指定されたファイル名からパス部分を除去する', async () => {
      const result = await storageManager.saveFile(Buffer.from('test'), {
        category: 'originals',
        extension: '.jpg',
        filename: '../malicious.jpg',
      });

      // basename により ../ が除去され、malicious.jpg のみになる
      expect(result.filename).toBe('malicious.jpg');
      expect(result.path).toBe('storage/originals/malicious.jpg');
    });
  });

  describe('設定の永続化', () => {
    it('設定を読み込める', async () => {
      // 新しいインスタンスを作成して設定を読み込む
      const newManager = new StorageManager();
      await newManager.loadConfig();

      expect(newManager.getPath()).toBe(testStoragePath);
    });

    it('設定ファイルが存在しない場合は null になる', async () => {
      // 設定ファイルを削除
      await rm(join(testConfigPath, 'storage-config.json'), { force: true });

      const newManager = new StorageManager();
      await newManager.loadConfig();

      expect(newManager.getPath()).toBeNull();
      expect(newManager.isInitialized()).toBe(false);
    });
  });

  describe('isInitialized', () => {
    it('パスが設定されている場合は true を返す', () => {
      expect(storageManager.isInitialized()).toBe(true);
    });

    it('パスが設定されていない場合は false を返す', async () => {
      const newManager = new StorageManager();
      expect(newManager.isInitialized()).toBe(false);
    });
  });

  describe('ファイル操作', () => {
    it('ファイルの存在を確認できる', async () => {
      await mkdir(join(testStoragePath, 'originals'), { recursive: true });
      const testFilePath = join(testStoragePath, 'originals', 'exists.txt');
      await writeFile(testFilePath, 'test');

      expect(await storageManager.fileExists('originals/exists.txt')).toBe(true);
      expect(await storageManager.fileExists('originals/not-exists.txt')).toBe(false);
    });

    it('ファイルサイズを取得できる', async () => {
      await mkdir(join(testStoragePath, 'originals'), { recursive: true });
      const content = 'test content';
      const testFilePath = join(testStoragePath, 'originals', 'size.txt');
      await writeFile(testFilePath, content);

      const size = await storageManager.getFileSize('originals/size.txt');
      expect(size).toBe(content.length);
    });

    it('ファイルを削除できる', async () => {
      await mkdir(join(testStoragePath, 'originals'), { recursive: true });
      const testFilePath = join(testStoragePath, 'originals', 'delete.txt');
      await writeFile(testFilePath, 'test');

      expect(await storageManager.fileExists('originals/delete.txt')).toBe(true);
      await storageManager.deleteFile('originals/delete.txt');
      expect(await storageManager.fileExists('originals/delete.txt')).toBe(false);
    });
  });

  describe('Windows/POSIX パス互換性', () => {
    it('path.sep を使用してパストラバーサルを検出する', async () => {
      // テストはプラットフォームに依存するが、両方のセパレータで試す
      const windowsPath = `..${sep}etc${sep}passwd`;
      await expect(storageManager.readFile(windowsPath)).rejects.toThrow(
        'Path traversal detected',
      );
    });
  });
});
