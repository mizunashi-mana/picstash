# API クライアントインターフェース T1 + T3

## 概要

プロジェクト「API クライアントインターフェース」のタスク T1 と T3 を同時に進める。

- T1: `@picstash/api` にインターフェース定義を追加（完了済み）
- T3: FetchApiClient 実装（entities 系: images, collections, labels）

関連プロジェクト: [20260205-api-client-interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

- `@picstash/api` の API クライアントインターフェース定義が完了していることを確認する
- web-client に entities 系の FetchApiClient 実装を作成する
- inversify コンテナにバインドして利用可能にする
- `useApiClient()` hook を追加し、コンポーネントから利用可能にする

## 実装方針

### ディレクトリ構成

```
packages/web-client/src/shared/
├── api/
│   ├── client.ts              # 既存の apiClient 関数（徐々に廃止予定）
│   ├── fetch-client/          # 新規作成
│   │   ├── index.ts           # Public API
│   │   ├── base-client.ts     # 共通 fetch ロジック
│   │   ├── fetch-image-api-client.ts
│   │   ├── fetch-collection-api-client.ts
│   │   ├── fetch-label-api-client.ts
│   │   └── fetch-api-client.ts # 統合 ApiClient 実装
│   └── index.ts
├── di/
│   ├── container.ts           # バインディング追加
│   ├── react.tsx              # useApiClient hook 追加
│   └── index.ts
└── index.ts
```

### 実装ステップ

1. `shared/api/fetch-client/base-client.ts` — 共通 fetch ロジックを作成
2. `FetchImageApiClient` — ImageApiClient の実装
3. `FetchCollectionApiClient` — CollectionApiClient の実装
4. `FetchLabelApiClient` — LabelApiClient の実装
5. `FetchApiClient` — 統合クラスでまとめる
6. コンテナにバインド
7. `useApiClient()` hook を追加
8. テスト追加

## 完了条件

- [x] T1: `@picstash/api` にインターフェース定義が存在する
- [ ] `shared/api/fetch-client/` に FetchImageApiClient が実装されている
- [ ] `shared/api/fetch-client/` に FetchCollectionApiClient が実装されている
- [ ] `shared/api/fetch-client/` に FetchLabelApiClient が実装されている
- [ ] `shared/api/fetch-client/` に統合 FetchApiClient が実装されている
- [ ] inversify コンテナに ApiClient がバインドされている
- [ ] `useApiClient()` hook が利用可能
- [ ] typecheck が通る
- [ ] lint が通る
- [ ] ユニットテストが通る

## 作業ログ

### 2026-02-05

- タスク開始
- T1 は既に完了済みであることを確認（`packages/api/src/client/` にインターフェース定義あり）
- 既存の entities API アダプター構造を分析:
  - `entities/image/api/image.ts`: 7 関数
  - `entities/collection/api/collection.ts`: 9 関数
  - `entities/label/api/label.ts`: 5 関数
