# dependency-cruiser セットアップ

## 目的・ゴール

`dependency-cruiser` を導入し、`packages/server` と `packages/client` の依存関係を検証できるようにする。

## 実装方針

1. `dependency-cruiser` を各パッケージにインストール（devDependencies）
2. 各パッケージに設定ファイル (`.dependency-cruiser.mjs`) を作成
3. 禁止する依存関係ルールを設定:
   - **server**: レイヤードアーキテクチャの依存方向を検証
     - `domain/` は他のレイヤーに依存しない
     - `application/` は `domain/` のみに依存可能
     - `infra/` は全レイヤーに依存可能
   - **client**: Feature-based 構造の依存関係を検証
     - `features/` 間の直接依存を禁止（shared 経由のみ）
     - 循環依存の検出
4. npm スクリプトを追加 (`lint:deps`)
5. CI 用に終了コードを返すよう設定

## 完了条件

- [x] `dependency-cruiser` がインストールされている
- [x] server の依存関係チェックが動作する
- [x] client の依存関係チェックが動作する
- [x] `npm run lint:deps` で両パッケージをチェックできる
- [x] レイヤー違反・循環依存を検出できる

## 作業ログ

### 2026-01-04

- タスク開始
- `dependency-cruiser` を server/client 両パッケージにインストール
- `.dependency-cruiser.mjs` 設定ファイルを作成（ESM形式）
  - server: レイヤードアーキテクチャのルール（domain→application→infra）
  - client: features 間の直接依存禁止、循環依存検出
- `lint:deps` スクリプトを各パッケージに追加
- Prisma 生成ファイル（`generated/`）を検査対象から除外
- 動作確認完了
- **タスク完了**
