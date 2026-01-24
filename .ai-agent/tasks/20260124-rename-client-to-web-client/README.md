# client パッケージを web-client パッケージに改名

## 目的・ゴール

`packages/client` パッケージを `packages/web-client` に改名し、パッケージ名を `@picstash/client` から `@picstash/web-client` に変更する。

将来的に他のクライアント（デスクトップアプリ、モバイルアプリなど）を追加する可能性を考慮し、Web クライアントであることを明示的にするためのリファクタリング。

## 実装方針

1. ディレクトリ名を `packages/client` から `packages/web-client` に変更
2. `packages/web-client/package.json` の `name` を `@picstash/web-client` に変更
3. ルート `package.json` の参照を更新
4. CI ワークフロー（`.github/workflows/ci-test.yml`）の参照を更新
5. ドキュメントの参照を更新（`.ai-agent/` 配下）
6. `package-lock.json` の再生成（`npm install`）
7. ビルド・テストで動作確認

## 変更対象ファイル

- `packages/client/` → `packages/web-client/`（ディレクトリ名変更）
- `packages/web-client/package.json`（パッケージ名変更）
- `package.json`（ルート、npm scripts の参照更新）
- `.github/workflows/ci-test.yml`（ワークスペース参照更新）
- `.ai-agent/steering/tech.md`（ドキュメント更新）
- `.ai-agent/structure.md`（ドキュメント更新）
- `.ai-agent/tasks/20260102-monorepo-setup/README.md`（履歴として保持）
- `.ai-agent/tasks/20260104-react-vite-client/README.md`（履歴として保持）

## 完了条件

- [x] ディレクトリが `packages/web-client` に改名されている
- [x] パッケージ名が `@picstash/web-client` に変更されている
- [x] すべての参照が更新されている
- [x] `npm install` が成功する
- [x] `npm run typecheck` が成功する
- [x] `npm run lint` が成功する
- [x] `npm run build` が成功する

## 作業ログ

### 2026-01-24

1. `packages/client` → `packages/web-client` にディレクトリ名を変更
2. `packages/web-client/package.json` の `name` を `@picstash/web-client` に変更
3. ルート `package.json` の `dev:client` スクリプトの参照を更新
4. `.github/workflows/ci-test.yml` の参照を更新
5. `.ai-agent/steering/tech.md` のパッケージ名を更新
6. `.ai-agent/structure.md` のディレクトリ構成を更新
7. `npm install` で `package-lock.json` を再生成
8. `npm run typecheck` / `npm run lint` / `npm run build` で動作確認 → すべて成功
9. **完了**
