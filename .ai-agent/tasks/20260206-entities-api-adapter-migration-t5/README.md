# T5: entities 層の API アダプター移行

## 概要

プロジェクト「API クライアントインターフェース」のタスク T5。entities 層の API アダプターを `apiClient` 関数 + endpoint 関数から、`ApiClient` インターフェース経由に移行する。

関連プロジェクト: [20260205-api-client-interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

- entities 層の API アダプター（3 ファイル）を `ApiClient` インターフェース経由に移行
- `apiClient` 関数と endpoint 関数への直接依存を排除
- FSD のレイヤー依存ルールに違反しないように shared 層に配置

## 現状分析

### 対象ファイル

| ファイル | 関数数 | 使用している endpoint |
|---------|--------|---------------------|
| `entities/image/api/image.ts` | 7 | `imageEndpoints` |
| `entities/collection/api/collection.ts` | 9 | `collectionsEndpoints`, `imageEndpoints` |
| `entities/label/api/label.ts` | 5 | `labelsEndpoints` |

### 現在のパターン

```typescript
// entities/collection/api/collection.ts（現状）
import { collectionsEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

export async function fetchCollections(): Promise<CollectionWithCount[]> {
  return await apiClient<CollectionWithCount[]>(collectionsEndpoints.list);
}
```

### 移行後のパターン

```typescript
// entities/collection/api/collection.ts（移行後）
import { useContainer } from '@/shared/di';
import type { ApiClient } from '@picstash/api';

export function useCollectionApi() {
  const apiClient = useContainer().get<ApiClient>(API_TYPES.ApiClient);

  return {
    fetchCollections: () => apiClient.collections.list(),
    // ...
  };
}
```

## 実装方針

### 方針選択

**方針 A**: entities の API モジュールを Hook 化して `useApiClient()` 経由に変更

- 各 entity の API モジュールを React Hook として再実装
- `useCollectionApi()`, `useImageApi()`, `useLabelApi()` を提供
- 利用側は Hook 経由で API 関数を取得

**方針 B**: entities の API モジュールを削除し、直接 `useApiClient()` を使用

- entities から API モジュールを削除
- 利用側で直接 `const apiClient = useApiClient()` を使用
- `apiClient.collections.list()` のように呼び出し

**採用**: 方針 B

理由:
1. `ApiClient` インターフェースが既に十分な抽象化を提供
2. entities 層の API モジュールは単なるラッパーになっており、追加の価値が低い
3. 直接 `ApiClient` を使用する方がシンプル
4. 型安全性は `ApiClient` インターフェースで担保されている

### 移行手順

1. 各 entity の API モジュールの利用箇所を特定
2. 利用箇所を `useApiClient()` 経由に変更
3. 不要になった API モジュールファイルを削除
4. typecheck / lint / テスト通過を確認

## 完了条件

- [x] `entities/image/api/image.ts` の利用箇所が `useApiClient()` 経由に移行
- [x] `entities/collection/api/collection.ts` の利用箇所が `useApiClient()` 経由に移行
- [x] `entities/label/api/label.ts` の利用箇所が `useApiClient()` 経由に移行
- [x] 不要になった entities API モジュールファイルを削除
- [x] typecheck が通る
- [x] lint が通る
- [x] ユニットテスト通過
- [x] Storybook 動作確認

## 作業ログ

### 2026-02-06

- タスク開始
- 現状分析完了
- 方針 B（entities API モジュールを削除し、直接 `useApiClient()` を使用）で実装
- entities/image の利用箇所を移行完了
- entities/collection の利用箇所を移行完了
- entities/label の利用箇所を移行完了
- 不要になった entities API ファイル・型定義ファイルを削除
- Storybook stories ファイルの props 修正
- テストファイルを DI コンテナ mock パターンに更新
- Storybook preview.tsx に ContainerProvider 追加
- 全テスト通過確認（419 tests）
- typecheck / lint 通過確認
- **タスク完了**
