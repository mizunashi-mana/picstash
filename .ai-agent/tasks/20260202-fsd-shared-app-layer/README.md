# T1: Shared レイヤーと App レイヤーの整理

## 目的・ゴール

web-client の `src/` 直下にある `api/client.ts`, `shared/`, `main.tsx`, `App.tsx`, `routes/` を FSD の Shared / App レイヤーに再配置し、FSD 移行の基盤を整える。

## 実装方針

### 移動対象

| 現在のパス | 移動先 | レイヤー |
|-----------|--------|---------|
| `src/main.tsx` | `src/app/main.tsx` | App |
| `src/App.tsx` | `src/app/App.tsx` | App |
| `src/routes/index.tsx` | `src/app/routes/index.tsx` | App |
| `src/api/client.ts` | `src/shared/api/client.ts` | Shared |
| `src/shared/helpers/url.ts` | `src/shared/lib/url.ts` | Shared |
| `src/shared/hooks/use-view-mode.ts` | `src/shared/hooks/use-view-mode.ts` | Shared（変更なし） |
| `src/shared/components/AppLayout.tsx` | そのまま（T5 で widgets に移動） | - |

### App レイヤー構造

```
src/app/
├── providers/
│   └── index.tsx       # QueryClient, Mantine, Router, JobsProvider
├── routes/
│   └── index.tsx       # Routes 定義
├── App.tsx             # ルートコンポーネント
└── main.tsx            # エントリポイント
```

### Shared レイヤー構造

```
src/shared/
├── api/
│   └── client.ts       # apiClient
├── lib/
│   ├── url.ts          # buildUrl
│   └── index.ts
├── hooks/
│   ├── use-view-mode.ts
│   └── index.ts
├── components/         # AppLayout（T5 まで暫定配置）
│   ├── AppLayout.tsx
│   └── index.ts
└── index.ts
```

### パス alias の更新

- `@/` → `./src/` は維持（既存コードとの互換性）
- FSD レイヤーは `@/app/`, `@/shared/`, `@/features/` 等でアクセス

### Providers の抽出

`main.tsx` にインラインで書かれているプロバイダー設定を `app/providers/index.tsx` に抽出する。

## 完了条件

- [x] App レイヤー (`src/app/`) が作成され、main.tsx, App.tsx, routes が配置されている
- [x] Providers が `app/providers/` に抽出されている
- [x] Shared レイヤーの `api/`, `lib/`, `hooks/` セグメントが整理されている
- [x] 全 import パスが更新されている
- [x] Vite のエントリポイント (`index.html`) が新しい main.tsx を参照している
- [x] `npm run typecheck` が通る
- [x] `npm run lint:eslint` が通る
- [x] `npm run dev` でアプリが正常に動作する

## 作業ログ

- 2026-02-02: タスク開始
- 2026-02-02: 実装完了
  - App レイヤー作成: `src/app/` に main.tsx, App.tsx, routes/, providers/ を配置
  - Providers 抽出: main.tsx のプロバイダーを `app/providers/index.tsx` の `AppProviders` コンポーネントに分離
  - Shared レイヤー再構成: `api/client.ts` → `shared/api/client.ts`, `helpers/` → `lib/` にリネーム
  - 全 import パス更新: src 8ファイル + tests 8ファイル（`@/api/client` → `@/shared/api/client`, `@/shared/helpers` → `@/shared/lib`）
  - index.html エントリポイント更新: `/src/main.tsx` → `/src/app/main.tsx`
  - dependency-cruiser 更新: `not-reachable-from-main` のパスと `shared-no-deps` の対象パスを更新
  - 検証結果: typecheck OK, 242 tests 全パス, ESLint OK, dependency-cruiser 123 modules 違反なし
