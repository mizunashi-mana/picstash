/**
 * Prisma 互換の軽量マイグレーションランナー。
 * better-sqlite3 で直接 SQL を実行し、_prisma_migrations テーブルを管理する。
 */

import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';

/**
 * _prisma_migrations テーブルの行
 */
interface PrismaMigrationRow {
  id: string;
  migration_name: string;
  checksum: string;
  finished_at: string | null;
  started_at: string;
  applied_steps_count: number;
  logs: string | null;
}

/**
 * マイグレーションディレクトリのパスを解決する。
 * desktop-app パッケージの prisma/migrations/ ディレクトリを返す。
 */
function resolveMigrationsDir(): string {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve('@picstash/desktop-app/package.json');
  const packageRoot = dirname(packageJsonPath);
  return join(packageRoot, 'prisma', 'migrations');
}

/**
 * _prisma_migrations テーブルが存在しない場合に作成する。
 */
function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id"                    TEXT PRIMARY KEY NOT NULL,
      "checksum"              TEXT NOT NULL,
      "finished_at"           DATETIME,
      "migration_name"        TEXT NOT NULL,
      "logs"                  TEXT,
      "rolled_back_at"        DATETIME,
      "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
    );
  `);
}

/**
 * 適用済みマイグレーション名のセットを取得する。
 */
function getAppliedMigrations(db: Database.Database): Set<string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-sqlite3 returns unknown[]
  const rows = db
    .prepare(
      'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL',
    )
    .all() as Array<Pick<PrismaMigrationRow, 'migration_name'>>;

  return new Set(rows.map(r => r.migration_name));
}

/**
 * UUID v4 を生成する
 */
function generateId(): string {
  return randomUUID();
}

/**
 * SQL 文字列の SHA-256 チェックサムを生成する。
 */
function computeChecksum(sql: string): string {
  return createHash('sha256').update(sql, 'utf-8').digest('hex');
}

/**
 * マイグレーションディレクトリを一覧し、名前の昇順でソートして返す。
 * migration_lock.toml などの非ディレクトリエントリはフィルタリングする。
 */
async function listMigrationDirs(migrationsDir: string): Promise<string[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

/**
 * 指定された DB パスに対してマイグレーションを実行する。
 *
 * @param dbPath - SQLite データベースファイルの絶対パス
 * @returns 適用されたマイグレーション数
 */
export async function runMigrations(dbPath: string): Promise<number> {
  const migrationsDir = resolveMigrationsDir();
  const db = new Database(dbPath);

  try {
    // WAL モードを有効にする（パフォーマンス向上）
    db.pragma('journal_mode = WAL');

    ensureMigrationsTable(db);

    const applied = getAppliedMigrations(db);
    const migrationDirs = await listMigrationDirs(migrationsDir);
    let appliedCount = 0;

    for (const migrationName of migrationDirs) {
      if (applied.has(migrationName)) {
        continue;
      }

      const sqlPath = join(migrationsDir, migrationName, 'migration.sql');
      const sql = await readFile(sqlPath, 'utf-8');
      const checksum = computeChecksum(sql);
      const id = generateId();
      const startedAt = new Date().toISOString();

      // トランザクション内でマイグレーション SQL を実行
      const applyMigration = db.transaction(() => {
        db.exec(sql);

        db.prepare(
          `INSERT INTO "_prisma_migrations"
            ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
          VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(id, checksum, migrationName, startedAt, new Date().toISOString(), 1);
      });

      applyMigration();
      appliedCount++;
    }

    return appliedCount;
  }
  finally {
    db.close();
  }
}
