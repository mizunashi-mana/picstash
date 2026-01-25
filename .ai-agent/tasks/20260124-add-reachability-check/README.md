# dependency-cruiser で main から到達可能性チェックを追加

## 目的・ゴール

`src/main.tsx` から辿れないファイル（デッドコード）を dependency-cruiser で検出するチェックを追加し、未使用コードが残らないようにする。

## 背景

- リファクタリング後に未使用ファイルが残る可能性がある
- 手動確認では漏れが発生しやすい
- CI で自動検出することでコードベースのクリーンさを維持

## 実装方針

1. `packages/web-client/.dependency-cruiser.mjs` に `not-reachable-from-main` ルールを追加
2. `packages/server/.dependency-cruiser.mjs` に `not-reachable-from-entry` ルールを追加
3. テストファイル、CLI ファイル等は除外
4. 検出されたデッドコードを削除

## 完了条件

- [x] `not-reachable-from-main` ルールが追加されている (web-client)
- [x] `not-reachable-from-entry` ルールが追加されている (server)
- [x] テストファイル等が適切に除外されている
- [x] `npm run lint` でチェックが実行できる
- [x] 検出されたデッドコードを削除

## 削除したデッドコード

### server

- `src/infra/storage/file-storage.ts`
- `src/infra/storage/image-processor.ts`
- `src/infra/database/label-repository.ts`
- `src/infra/database/image-repository.ts`
- `src/infra/database/image-attribute-repository.ts`
- `src/domain/stats/index.ts`
- `src/domain/index.ts`
- `src/application/ports/index.ts`

空になったディレクトリも削除:
- `src/infra/storage/`
- `src/domain/stats/`

## 作業ログ

- ブランチ `add-reachability-check` を作成
- web-client に `not-reachable-from-main` ルールを追加
- server に `not-reachable-from-entry` ルールを追加
- CLI からのみ使用される `generate-label-embeddings.ts` を除外に追加
- 検出されたデッドコード 8 ファイルを削除
- 空ディレクトリ 2 つを削除
- lint / typecheck 成功を確認
