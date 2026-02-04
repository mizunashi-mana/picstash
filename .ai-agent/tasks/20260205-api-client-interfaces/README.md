# T1: `@picstash/api` に API クライアントインターフェース定義を追加

プロジェクト: [API クライアントインターフェース移行](../../projects/20260205-api-client-interface/README.md)

## 目的

`@picstash/api` パッケージにリソース単位の API クライアントインターフェース（12 インターフェース）と統合 `ApiClient` インターフェース、DI トークン（`API_TYPES`）を追加する。

## 実装方針

- `packages/api/src/client/` ディレクトリに各インターフェースファイルを配置
- 型定義は既存の web-client API アダプターで使用されている型をそのまま参照
- `@picstash/api` で既に定義されている型（`Label`, `ImageListQuery`, `StatsQueryOptions` 等）はそのまま使用
- web-client のみで定義されている型（`Image`, `Collection`, `ViewHistory` 等）は `@picstash/api` に移動
- DI トークンはサーバー側 `TYPES` と別の名前空間 `API_TYPES` で定義

## 完了条件

- [ ] `@picstash/api` から 12 個のリソース別インターフェース + 統合 `ApiClient` がインポート可能
- [ ] `API_TYPES` がインポート可能
- [ ] 関連する型定義が `@picstash/api` に含まれている
- [ ] `npm run typecheck` が通る
- [ ] `npm run lint` が通る

## 作業ログ

- 2026-02-05: タスク開始
