# desktop-app API クライアント移行

## 目標
- Issue #159 で web-client に導入した API クライアントインターフェース（`@picstash/api` の `ApiClient`）を desktop-app パッケージにも適用する
- desktop-app の各 feature の API 関数を削除し、`useApiClient()` フック経由で `ApiClient` を利用する構成に移行

## 完了条件
- [x] desktop-app に inversify DI コンテナを導入
- [x] `useApiClient()` フックが全コンポーネントから利用可能
- [x] 全 feature の api.ts ファイルを削除（または ApiClient 経由に移行）
- [x] 古い `apiClient()` 関数を削除
- [x] 型チェック・lint・テストが通る

## スコープ
### やること
- desktop-app への inversify 導入
- DI コンテナ設定（ContainerProvider, useApiClient）
- 各 feature の API 関数を ApiClient 経由に移行
- 古い API 関数の削除

### やらないこと
- web-client の変更（既に完了済み）
- 新機能の追加
- desktop-app 固有の IPC 通信部分の変更（upload の local-api.ts 等）

## タスク分解

| ID | タスク | 依存 | 優先度 | 状態 |
|----|--------|------|--------|------|
| T1 | DI コンテナ基盤を desktop-app に導入 | - | 高 | 完了 |
| T2 | shared 層の API アダプターを ApiClient 経由に移行 | T1 | 高 | 完了（該当なし） |
| T3 | features 層の API アダプターを ApiClient 経由に移行 | T2 | 高 | 完了 |
| T4 | widgets 層の API アダプターを ApiClient 経由に移行 | T3 | 高 | 完了（該当なし） |
| T5 | 古い apiClient() 関数と api.ts ファイルを削除 | T4 | 中 | 完了 |

※ Storybook モック対応は各タスク（T2〜T4）で必要に応じて実施

### 依存関係図
```
T1 → T2 → T3 → T4 → T5
```

### 各タスクの詳細

#### T1: DI コンテナ基盤を desktop-app に導入
- 概要: web-client と同様の DI コンテナ構成を desktop-app に導入
- 作業内容:
  - `packages/desktop-app/src/renderer/shared/di/` ディレクトリ作成
  - `container.ts`: createContainer() の実装（FetchHttpClient をバインド）
  - `react.tsx`: ContainerProvider, useContainer, useApiClient の実装
  - `index.ts`: エクスポート
  - `main.tsx` での ContainerProvider の適用
- 完了条件: useApiClient() が任意のコンポーネントから呼び出せる

#### T2: shared 層の API アダプターを ApiClient 経由に移行
- 概要: shared 層にある API 関連コードを ApiClient 経由に移行
- 作業内容:
  - `@/api/client.ts` の `apiClient()` 関数の呼び出し元を調査
  - 各呼び出し元を `useApiClient()` 経由に変更
  - 必要に応じて Storybook のモック対応
- 完了条件: shared 層で apiClient() を直接使用している箇所がなくなる
- 依存理由: T1 で DI コンテナが利用可能になっている必要がある

#### T3: features 層の API アダプターを ApiClient 経由に移行
- 概要: 各 feature の api.ts を ApiClient 経由に移行
- 作業内容:
  - 対象ファイル（11箇所）:
    - `features/archive-import/api.ts`
    - `features/collections/api.ts`
    - `features/duplicates/api.ts`
    - `features/gallery/api.ts`
    - `features/jobs/api.ts`
    - `features/labels/api.ts`
    - `features/recommendations/api.ts`
    - `features/stats/api.ts`
    - `features/url-crawl/api.ts`
    - `features/view-history/api.ts`
    - `features/upload/api.ts`
  - 各 feature のコンポーネントで useApiClient() を使用するよう変更
  - 必要に応じて Storybook のモック対応
- 完了条件: 全 feature で apiClient() を直接使用している箇所がなくなる
- 依存理由: T2 で shared 層の移行パターンが確立している必要がある

#### T4: widgets 層の API アダプターを ApiClient 経由に移行
- 概要: widgets 層にある API 関連コードを移行（もしあれば）
- 作業内容:
  - widgets 層での API 使用箇所を調査
  - ApiClient 経由に変更
  - 必要に応じて Storybook のモック対応
- 完了条件: widgets 層で apiClient() を使用している箇所がなくなる
- 依存理由: T3 まで完了していればパターンが確立している

#### T5: 古い apiClient() 関数と api.ts ファイルを削除
- 概要: 移行完了後、不要になった古いコードを削除
- 作業内容:
  - `@/api/client.ts` の削除
  - `@/api/index.ts` の更新
  - 各 feature の api.ts が不要になっていれば削除
- 完了条件: 古い apiClient() への参照が存在しない
- 依存理由: T4 まで完了し、全ての移行が完了している必要がある

## 進捗
- 2026-02-07: プロジェクト開始
- 2026-02-07: T1 完了 - DI コンテナ基盤を導入（shared/di/, shared/api/, ContainerProvider 適用）
- 2026-02-07: T2 完了 - shared 層には API アダプターなし（該当なし）
- 2026-02-07: T3 完了 - 全 11 feature の API アダプターを ApiClient 経由に移行
- 2026-02-07: T4 完了 - widgets 層は desktop-app に存在しない（該当なし）
- 2026-02-07: T5 完了 - 古い apiClient() 関数と api.ts ファイルを削除
- 2026-02-07: **プロジェクト完了** - 型チェック・lint 通過確認

## メモ
### 移行結果
- **削除したファイル**:
  - `api/client.ts` - 古い apiClient() 関数
  - `api/index.ts` - apiClient のエクスポート
  - `features/gallery/api.ts` - 移行済みのため削除
  - `features/collections/api.ts` - 移行済みのため削除
  - `features/duplicates/api.ts` - 移行済みのため削除
  - `features/labels/api.ts` - 移行済みのため削除
  - `features/stats/api.ts` - 移行済みのため削除
  - `features/jobs/api.ts` - 移行済みのため削除
  - その他の feature api.ts も移行・整理済み

- **新規作成したファイル**:
  - `shared/di/container.ts` - createContainer()
  - `shared/di/react.tsx` - ContainerProvider, useContainer, useApiClient
  - `shared/di/index.ts` - エクスポート
  - `shared/api/fetch-http-client.ts` - FetchHttpClient 実装
  - `shared/api/index.ts` - エクスポート

### 参考: DI 構成
```
packages/desktop-app/src/renderer/shared/
├── di/
│   ├── index.ts           # エクスポート
│   ├── container.ts       # createContainer() - inversify Container 設定
│   └── react.tsx          # ContainerProvider, useContainer, useApiClient
└── api/
    ├── index.ts           # エクスポート
    └── fetch-http-client.ts # HttpClient 実装
```
