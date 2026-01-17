# サーバの設定ファイルのパスを指定可能にする

## 目的・ゴール

現在、設定ファイル (`config.yaml`) のパスはソースコード内でハードコードされている。
これをコマンドライン引数または環境変数で指定可能にすることで、異なる環境での運用を容易にする。

**現状:**
```typescript
// config.ts
const configPath = resolve(currentDir, '../config.yaml');
```

**目標:**
- コマンドライン引数 `--config` でパスを指定可能
- 環境変数 `PICSTASH_CONFIG` でもパスを指定可能
- デフォルトは現状の `packages/server/config.yaml`

## 実装方針

1. `config.ts` を関数ベースに変更（`loadConfig(configPath?: string)`）
2. コマンドライン引数のパース（`--config` オプション）
3. 環境変数のフォールバック
4. `index.ts` と CLI スクリプトで設定パスを渡す

### 優先順位

1. コマンドライン引数 `--config path/to/config.yaml`
2. 環境変数 `PICSTASH_CONFIG`
3. デフォルトパス `packages/server/config.yaml`

## 完了条件

- [x] `config.ts` が設定パスを引数として受け取れる
- [x] サーバ起動時に `--config` オプションで設定ファイルを指定可能
- [x] CLI コマンドでも `--config` オプションが使用可能
- [x] 環境変数でも設定パスを指定可能
- [x] 型チェック・lint がパスする
- [x] 既存のテストがパスする

## 作業ログ

### 2026-01-18: 実装完了

**変更ファイル:**

1. `packages/server/src/config.ts`
   - `loadConfig(configPath?: string)` 関数を追加
   - `initConfig(configPath?: string)` 関数を追加（設定の初期化）
   - `getConfig()` 関数を追加（遅延読み込み対応）
   - `parseConfigArg(args: string[])` 関数を追加（CLI引数のパース）
   - `--config=path` と `--config path` 両形式に対応

2. `packages/server/src/index.ts`
   - `parseConfigArg()` と `initConfig()` を使用するよう更新

3. `packages/server/src/cli/generate-embeddings.ts`
   - `--config` オプションのサポートを追加

4. `packages/server/src/cli/generate-label-embeddings.ts`
   - `--config` オプションのサポートを追加

5. その他のファイル（遅延読み込み対応）:
   - `packages/server/src/infra/adapters/local-file-storage.ts`
   - `packages/server/src/infra/adapters/sharp-image-processor.ts`
   - `packages/server/src/infra/adapters/in-memory-archive-session-manager.ts`
   - `packages/server/src/infra/storage/file-storage.ts`
   - `packages/server/src/infra/storage/image-processor.ts`

**使用方法:**

```bash
# コマンドライン引数で指定
npm run dev -w @picstash/server -- --config /path/to/config.yaml

# 環境変数で指定
PICSTASH_CONFIG=/path/to/config.yaml npm run dev -w @picstash/server

# CLI コマンドでも使用可能
npm run embedding:generate -w @picstash/server -- --config /path/to/config.yaml
```
