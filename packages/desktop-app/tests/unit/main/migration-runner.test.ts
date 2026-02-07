import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @picstash/core のパス解決をモック
const mockMigrationsDir = join(tmpdir(), `picstash-migrations-test-${Date.now()}`);

vi.mock('node:module', () => ({
  createRequire: () => ({
    resolve: (id: string) => {
      if (id === '@picstash/desktop-app/package.json') {
        // モック用のルートディレクトリを返す（prisma/migrations/ をそこに作る）
        return join(mockMigrationsDir, 'package.json');
      }
      throw new Error(`Cannot resolve ${id}`);
    },
  }),
}));

const { runMigrations } = await import('../../../src/main/migration-runner.js');

describe('runMigrations', () => {
  let testDir: string;
  let dbPath: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `picstash-migration-runner-test-${Date.now()}`);
    dbPath = join(testDir, 'test.db');
    await mkdir(testDir, { recursive: true });
    // モック用のマイグレーションディレクトリを作成
    await mkdir(join(mockMigrationsDir, 'prisma', 'migrations'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await rm(mockMigrationsDir, { recursive: true, force: true });
  });

  it('マイグレーションディレクトリが空の場合は 0 を返す', async () => {
    const count = await runMigrations(dbPath);
    expect(count).toBe(0);

    // _prisma_migrations テーブルが作成されていることを確認
    const db = new Database(dbPath);
    try {
      const rows = db
        .prepare('SELECT count(*) as cnt FROM "_prisma_migrations"')
        .get() as { cnt: number };
      expect(rows.cnt).toBe(0);
    }
    finally {
      db.close();
    }
  });

  it('マイグレーション SQL を実行して _prisma_migrations に記録する', async () => {
    // テスト用のマイグレーション SQL を作成
    const migrationDir = join(
      mockMigrationsDir,
      'prisma',
      'migrations',
      '20260101000000_test_migration',
    );
    await mkdir(migrationDir, { recursive: true });
    await writeFile(
      join(migrationDir, 'migration.sql'),
      'CREATE TABLE "test_table" ("id" TEXT PRIMARY KEY NOT NULL, "name" TEXT NOT NULL);',
    );

    const count = await runMigrations(dbPath);
    expect(count).toBe(1);

    // テーブルが作成されていることを確認
    const db = new Database(dbPath);
    try {
      const rows = db
        .prepare('SELECT * FROM "test_table"')
        .all();
      expect(rows).toEqual([]);

      // _prisma_migrations にレコードがあることを確認
      const migrations = db
        .prepare('SELECT * FROM "_prisma_migrations"')
        .all() as Array<{
        migration_name: string;
        finished_at: string | null;
        applied_steps_count: number;
        checksum: string;
      }>;
      expect(migrations).toHaveLength(1);
      expect(migrations[0]?.migration_name).toBe('20260101000000_test_migration');
      expect(migrations[0]?.finished_at).not.toBeNull();
      expect(migrations[0]?.applied_steps_count).toBe(1);
      expect(migrations[0]?.checksum).toMatch(/^[a-f0-9]{64}$/);
    }
    finally {
      db.close();
    }
  });

  it('既に適用済みのマイグレーションはスキップする', async () => {
    // マイグレーション SQL を作成
    const migrationDir = join(
      mockMigrationsDir,
      'prisma',
      'migrations',
      '20260101000000_test_skip',
    );
    await mkdir(migrationDir, { recursive: true });
    await writeFile(
      join(migrationDir, 'migration.sql'),
      'CREATE TABLE "skip_table" ("id" TEXT PRIMARY KEY NOT NULL);',
    );

    // 1 回目の実行
    const count1 = await runMigrations(dbPath);
    expect(count1).toBe(1);

    // 2 回目の実行（スキップされるべき）
    const count2 = await runMigrations(dbPath);
    expect(count2).toBe(0);

    // _prisma_migrations のレコード数は変わらない
    const db = new Database(dbPath);
    try {
      const migrations = db
        .prepare('SELECT count(*) as cnt FROM "_prisma_migrations"')
        .get() as { cnt: number };
      expect(migrations.cnt).toBe(1);
    }
    finally {
      db.close();
    }
  });

  it('複数のマイグレーションを昇順で適用する', async () => {
    const migrationsBase = join(mockMigrationsDir, 'prisma', 'migrations');

    // 2 つのマイグレーションを作成（名前の昇順で適用される）
    const dir1 = join(migrationsBase, '20260101000000_first');
    const dir2 = join(migrationsBase, '20260102000000_second');
    await mkdir(dir1, { recursive: true });
    await mkdir(dir2, { recursive: true });

    await writeFile(
      join(dir1, 'migration.sql'),
      'CREATE TABLE "first_table" ("id" TEXT PRIMARY KEY NOT NULL);',
    );
    await writeFile(
      join(dir2, 'migration.sql'),
      'CREATE TABLE "second_table" ("id" TEXT PRIMARY KEY NOT NULL);',
    );

    const count = await runMigrations(dbPath);
    expect(count).toBe(2);

    // 両テーブルが存在することを確認
    const db = new Database(dbPath);
    try {
      db.prepare('SELECT * FROM "first_table"').all();
      db.prepare('SELECT * FROM "second_table"').all();

      const migrations = db
        .prepare(
          'SELECT migration_name FROM "_prisma_migrations" ORDER BY started_at',
        )
        .all() as Array<{ migration_name: string }>;
      expect(migrations).toHaveLength(2);
      expect(migrations[0]?.migration_name).toBe('20260101000000_first');
      expect(migrations[1]?.migration_name).toBe('20260102000000_second');
    }
    finally {
      db.close();
    }
  });

  it('migration_lock.toml などの非ディレクトリを無視する', async () => {
    const migrationsBase = join(mockMigrationsDir, 'prisma', 'migrations');

    // ファイル（非ディレクトリ）を作成
    await writeFile(join(migrationsBase, 'migration_lock.toml'), 'provider = "sqlite"');

    const count = await runMigrations(dbPath);
    expect(count).toBe(0);
  });

  it('チェックサムが SHA-256 形式で記録される', async () => {
    const migrationDir = join(
      mockMigrationsDir,
      'prisma',
      'migrations',
      '20260101000000_checksum_test',
    );
    await mkdir(migrationDir, { recursive: true });

    const sql = 'CREATE TABLE "checksum_table" ("id" TEXT PRIMARY KEY NOT NULL);';
    await writeFile(join(migrationDir, 'migration.sql'), sql);

    await runMigrations(dbPath);

    // チェックサムを手動計算して比較
    const { createHash } = await import('node:crypto');
    const expectedChecksum = createHash('sha256').update(sql, 'utf-8').digest('hex');

    const db = new Database(dbPath);
    try {
      const row = db
        .prepare('SELECT checksum FROM "_prisma_migrations" LIMIT 1')
        .get() as { checksum: string };
      expect(row.checksum).toBe(expectedChecksum);
    }
    finally {
      db.close();
    }
  });

  it('マイグレーション SQL が不正な場合はエラーを投げる', async () => {
    const migrationDir = join(
      mockMigrationsDir,
      'prisma',
      'migrations',
      '20260101000000_invalid',
    );
    await mkdir(migrationDir, { recursive: true });
    await writeFile(join(migrationDir, 'migration.sql'), 'INVALID SQL SYNTAX HERE;');

    await expect(runMigrations(dbPath)).rejects.toThrow();

    // _prisma_migrations にレコードが記録されていないことを確認
    const db = new Database(dbPath);
    try {
      const row = db
        .prepare('SELECT count(*) as cnt FROM "_prisma_migrations"')
        .get() as { cnt: number };
      expect(row.cnt).toBe(0);
    }
    finally {
      db.close();
    }
  });

  it('DB ファイルが存在しない場合は新規作成される', async () => {
    const newDbPath = join(testDir, 'nonexistent', 'subdir', 'new.db');
    await mkdir(join(testDir, 'nonexistent', 'subdir'), { recursive: true });

    const count = await runMigrations(newDbPath);
    expect(count).toBe(0);

    // ファイルが作成されたことを確認
    await expect(readFile(newDbPath)).resolves.toBeDefined();
  });
});
