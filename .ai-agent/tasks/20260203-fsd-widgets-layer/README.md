# T5: Widgets レイヤーの導入

## 目的・ゴール

AppLayout や JobStatusButton など、自己完結した大きな UI ブロックを FSD の Widgets レイヤーに分離する。App レイヤーから Widgets レイヤーを経由して features/entities を組み合わせる構造を実現する。

## 実装方針

### 移動対象

#### widgets/app-layout/

- **移動元**: `shared/components/AppLayout.tsx` + `AppLayout.stories.tsx`
- **移動先**: `widgets/app-layout/ui/AppLayout.tsx` + stories
- **理由**: AppLayout はナビゲーション・サイドバーを含む大きな UI ブロックで、shared の「汎用部品」より widgets の「自己完結ブロック」に該当する

#### widgets/job-status/

- **移動元**: `features/jobs/` 全体
  - `components/JobStatusButton.tsx` + CSS module → `widgets/job-status/ui/`
  - `context.tsx` (JobsProvider, useJobs) → `widgets/job-status/model/`
  - `api.ts` (Job 型, listJobs, getJob) → `widgets/job-status/api/`
  - `utils.ts` (getJobTypeName, getImageId) → `widgets/job-status/lib/`
- **理由**: ジョブステータスは複数 features で使われるアプリケーション全体の UI ブロック。features/jobs は「ユーザーアクション」ではなく「ステータス表示ウィジェット」

### ディレクトリ構成

```
src/widgets/
├── app-layout/
│   ├── ui/
│   │   ├── AppLayout.tsx
│   │   └── AppLayout.stories.tsx
│   └── index.ts              # Public API: AppLayout
└── job-status/
    ├── ui/
    │   ├── JobStatusButton.tsx
    │   └── JobStatusButton.module.css
    ├── model/
    │   └── context.tsx         # JobsProvider, useJobs
    ├── api/
    │   └── jobs.ts             # Job 型, listJobs, getJob
    ├── lib/
    │   └── utils.ts            # getJobTypeName, getImageId, getJobTargetDescription
    └── index.ts                # Public API: JobStatusButton, JobsProvider, useJobs
```

### import パスの更新対象

**App レイヤー:**

- `app/App.tsx`:
  - `@/features/jobs` → `@/widgets/job-status` (JobStatusButton)
  - `@/shared` → `@/widgets/app-layout` (AppLayout)
- `app/providers/index.tsx`:
  - `@/features/jobs` → `@/widgets/job-status` (JobsProvider)

**shared/components/ の更新:**

- `shared/components/AppLayout.tsx` → 削除（widgets に移動）
- `shared/components/AppLayout.stories.tsx` → 削除（widgets に移動）
- `shared/components/index.ts` → 削除
- `shared/index.ts` → `./components` の export を削除

**features/jobs/ の更新:**

- `features/jobs/` → 削除（widgets/job-status に移動）

**Features レイヤーからの参照:**

- `features/manage-image-description/` 等で `useJobs` を使っている箇所があれば `@/widgets/job-status` に変更

**テストファイルの更新:**

- `tests/features/jobs/` → `tests/widgets/job-status/` に移動
- import パスの更新

**dependency-cruiser:**

- `.dependency-cruiser.mjs` に widgets ディレクトリを追加（必要に応じて）

### tsconfig / vite パス alias

- `@/widgets` alias の追加（通常 `@/` が `src/` を指すため追加不要の可能性）

## 完了条件

- [x] `widgets/app-layout/` が作成され、AppLayout が配置されている
- [x] `widgets/job-status/` が作成され、JobStatusButton + JobsProvider + useJobs + API + utils が配置されている
- [x] `shared/components/` から AppLayout が削除されている
- [x] `features/jobs/` が削除されている
- [x] `app/App.tsx` が widgets からインポートしている
- [x] `app/providers/index.tsx` が widgets からインポートしている
- [x] features レイヤーからの jobs 参照が widgets に変更されている
- [x] テストが widgets 配下に移動・更新されている
- [x] `npm run typecheck` が通る
- [x] `npm run test` が通る（242 テスト）
- [x] `npm run lint:eslint` が通る
- [x] `npm run lint:deps` が通る（137 modules, 391 dependencies）
- [x] `npm run build` が通る

## 作業ログ

- 2026-02-03: タスク開始
- 2026-02-03: widgets/app-layout/ 作成（shared/components/AppLayout から移動）
- 2026-02-03: widgets/job-status/ 作成（features/jobs/ から移動、FSD セグメント構造に再構成）
- 2026-02-03: import パス更新（app, features, tests）
- 2026-02-03: dependency-cruiser に widgets レイヤールール追加
- 2026-02-03: 全チェック通過、タスク完了
