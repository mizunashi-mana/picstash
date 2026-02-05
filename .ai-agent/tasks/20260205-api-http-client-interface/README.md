# T1: HttpClient interface を定義

プロジェクト: [API Client Interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

`@picstash/api` パッケージに HTTP リクエストを抽象化する `HttpClient` interface を定義する。これにより、クライアントパッケージ（web-client, desktop-app 等）は HTTP Client の実装（fetch, axios 等）のみを提供し、URL ビルドや API の抽象化は api パッケージに任せることができる。

## 実装方針

1. `packages/api/src/client/http-client.ts` に以下を定義:
   - `RequestOptions` 型: ヘッダーやタイムアウト等のオプション
   - `HttpClient` interface: get, post, put, patch, delete, postFormData メソッド

2. `API_TYPES` に `HttpClient` シンボルを追加

3. `packages/api/src/index.ts` からエクスポート

## 完了条件

- [x] `HttpClient` interface が `@picstash/api` からインポート可能
- [x] `API_TYPES.HttpClient` が定義されている
- [x] typecheck が通る
- [x] lint が通る

## 作業ログ

- 2026-02-05: タスク開始
- 2026-02-05: 実装完了
  - `packages/api/src/client/http-client.ts` を作成
  - `RequestOptions` 型と `HttpClient` interface を定義
  - `API_TYPES.HttpClient` シンボルを追加
  - `client/index.ts` からエクスポート
  - api パッケージに `engines.node >= 22` を設定（FormData サポートのため）
  - `lint:eslint` スクリプトを追加
