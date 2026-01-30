# SQLite データベースのローカル配置 (T6)

## 目的

デスクトップアプリのメインプロセスで `@picstash/core` の DI コンテナを初期化し、SQLite データベースをユーザーデータディレクトリに配置する。アプリ起動時にマイグレーションを自動実行し、既存の全リポジトリ・サービスをメインプロセスから利用可能にする。

## 前提条件

- T5（ローカルファイルシステムアダプタ実装）: `LocalFileStorage` は `@picstash/core` に実装済み。DI コンテナでバインド済み。
- `StorageManager` によるストレージパスの管理が実装済み。
- `CoreConfig` インターフェースが定義済み（database.path, storage.path は絶対パス必須）。

## 実装方針

### 1. データベースパスの決定

- DB ファイルはストレージパス配下 `{storagePath}/picstash.db` に配置
  - ストレージパスはユーザーが選択するフォルダ（`StorageManager.getPath()`）
  - DB とファイルストレージが同一ディレクトリ配下にまとまり、バックアップ・移動が容易
- ストレージパス未設定時は `@picstash/core` を初期化しない

### 2. @picstash/core の初期化

- `StorageManager` のパス設定後に `CoreConfig` を構築し `buildCoreContainer()` を呼ぶ
- `PrismaService.connect()` でデータベース接続
- コンテナインスタンスをモジュールスコープで保持し、IPC ハンドラから参照可能にする

### 3. マイグレーションの自動実行

- Prisma の `prisma migrate deploy` 相当の処理をプログラマティックに実行
- `@prisma/migrate` パッケージは Electron バンドルに含めると複雑になるため、代わりに `child_process` で `prisma migrate deploy` を実行する方式を検討
- もしくは、Prisma の `$executeRawUnsafe` でマイグレーション SQL を直接実行する軽量な仕組みを実装
- **方針決定**: マイグレーション SQL ファイルを直接読み込んで実行する軽量アプローチを採用（Prisma CLI 依存を避ける）

### 4. 既存コードとの統合

- `uploadService` を `@picstash/core` の `ImageRepository` + `FileStorage` に置き換え
- IPC ハンドラから `CoreContainer` のリポジトリ・サービスにアクセス

## 完了条件

- [ ] DB ファイルがストレージディレクトリ（ユーザー選択フォルダ）に保存される
- [ ] アプリ起動時（ストレージ設定済みの場合）に自動でマイグレーションが実行される
- [ ] `@picstash/core` の DI コンテナがメインプロセスで利用可能になる
- [ ] 既存のユニットテストが通る
- [ ] lint が通る

## 作業ログ

- 2026-01-30: タスク開始
