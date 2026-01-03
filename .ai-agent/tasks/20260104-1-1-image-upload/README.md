# 1-1: 画像アップロード・保存

## 目的・ゴール

画像をアップロードしてサーバーに保存できるようにする。

## 現状

- Prisma スキーマに `Image` モデルは定義済み
- storage ディレクトリは未作成
- API エンドポイント・UI は未実装

## 実装方針

### バックエンド

1. **ストレージ設定**
   - `storage/originals/` ディレクトリを作成
   - `config.yaml` の `storage.path` で保存先を設定（環境変数は使用しない）

2. **ファイルストレージサービス** (`infra/storage/`)
   - ファイル保存・削除機能
   - ユニークなファイル名生成（UUID）
   - `config.storage.path` からパスを取得

3. **アップロード API** (`POST /api/images`)
   - `@fastify/multipart` でファイル受信
   - 画像のバリデーション（MIME タイプ、サイズ上限）
   - DB に Image レコード作成
   - ファイルをストレージに保存

### フロントエンド

4. **アップロード UI** (`features/upload/`)
   - ドラッグ＆ドロップ対応
   - Mantine の Dropzone コンポーネント使用
   - アップロード進捗表示
   - TanStack Query で API 呼び出し

## 完了条件

- [x] 画像ファイルをアップロードできる
- [x] アップロードした画像が storage/ に保存される
- [x] Image レコードが DB に作成される
- [x] curl でアップロード API が動作する
- [x] フロントエンドからアップロードできる

## 作業ログ

### 2026-01-04

- タスク開始
- `storage/originals/` ディレクトリを作成
- `config.yaml` のストレージパスを `../../storage` に修正
- ファイルストレージサービスを実装 (`infra/storage/file-storage.ts`)
- 画像リポジトリを実装 (`infra/database/image-repository.ts`)
- アップロード API を実装 (`POST /api/images`)
  - `@fastify/multipart` プラグインを登録
  - MIME タイプ・サイズバリデーション
- curl で動作確認完了
- フロントエンド実装
  - `@mantine/dropzone` をインストール
  - `features/upload/` に Dropzone コンポーネント作成
  - HomePage に Dropzone を追加
- ブラウザで動作確認完了
- **タスク完了**
