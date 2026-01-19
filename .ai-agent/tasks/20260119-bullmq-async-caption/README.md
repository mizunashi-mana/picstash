# 説明文生成の非同期ジョブ化

## 目的・ゴール

説明文生成（キャプション生成）処理を非同期ジョブ化し、API レスポンスを高速化する。
ジョブキュー基盤を整備し、将来的に他の重い処理（埋め込み生成等）も非同期化できるようにする。

## 現状分析

- 説明文生成は `/api/images/:id/generate-description` で同期的に実行
- ViT-GPT2 によるキャプション生成 + NLLB による日本語翻訳 + (オプション) LLM による改善
- 処理時間が長く、ユーザーは完了まで待つ必要がある
- 現在は Redis を使用していない

## 実装方針

### 1. 技術選定

- **SQLite ベースのジョブキュー**: 既定のアダプター（追加依存なし）
- **ポート/アダプターパターン**: 将来 Redis (BullMQ) にも切り替え可能な抽象化

### 2. アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   API Server    │     │  JobQueue Port  │     │   Worker        │
│   (Producer)    │ ──▶ │   (抽象化層)     │ ◀── │   (同一プロセス)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌─────────────┐       ┌─────────────┐
            │   SQLite    │       │    Redis    │
            │  (既定)     │       │  (将来対応)  │
            └─────────────┘       └─────────────┘
```

### 3. API 設計

#### ジョブ作成（既存 API を変更）
```
POST /api/images/:id/generate-description
Response: { jobId: string, status: "queued" }
```

#### ジョブ状態確認（新規 API）
```
GET /api/jobs/:jobId
Response: {
  id: string,
  type: "caption-generation",
  status: "waiting" | "active" | "completed" | "failed",
  progress?: number,
  result?: { description: string, model: string },
  error?: string,
  createdAt: string,
  updatedAt: string
}
```

### 4. データベース設計

```prisma
model Job {
  id          String   @id @default(uuid())
  type        String                          // "caption-generation" など
  status      String   @default("waiting")    // waiting, active, completed, failed
  payload     String                          // JSON: ジョブ固有のデータ
  result      String?                         // JSON: 完了時の結果
  error       String?                         // 失敗時のエラーメッセージ
  progress    Int      @default(0)            // 0-100
  attempts    Int      @default(0)            // 試行回数
  maxAttempts Int      @default(3)            // 最大試行回数
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  startedAt   DateTime?
  completedAt DateTime?

  @@index([status])
  @@index([type, status])
  @@map("jobs")
}
```

### 5. ポート定義

```typescript
// application/ports/job-queue.ts
export interface Job<TPayload = unknown, TResult = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  payload: TPayload;
  result?: TResult;
  error?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export interface JobQueue {
  /** ジョブを追加 */
  add<T>(type: string, payload: T): Promise<Job<T>>;

  /** ジョブを取得 */
  getJob(id: string): Promise<Job | null>;

  /** 待機中のジョブを1件取得してアクティブに */
  acquireJob(type: string): Promise<Job | null>;

  /** ジョブを完了 */
  completeJob<T>(id: string, result: T): Promise<void>;

  /** ジョブを失敗 */
  failJob(id: string, error: string): Promise<void>;

  /** 進捗を更新 */
  updateProgress(id: string, progress: number): Promise<void>;
}
```

### 6. ディレクトリ構成

```
packages/server/src/
├── application/
│   └── ports/
│       └── job-queue.ts           # ジョブキューのポート定義
├── infra/
│   ├── queue/
│   │   ├── index.ts
│   │   ├── sqlite-job-queue.ts    # SQLite 実装
│   │   └── job-worker.ts          # ワーカー基盤
│   ├── workers/
│   │   └── caption-worker.ts      # キャプション生成ワーカー
│   └── di/
│       └── ...                    # DI 設定追加
└── domain/
    └── job/
        └── index.ts               # Job ドメインモデル
```

### 7. ワーカー実行

サーバープロセス内でポーリングベースのワーカーを実行:

```typescript
// サーバー起動時
const worker = new JobWorker(jobQueue, captionService);
worker.start(); // setInterval でポーリング
```

## 完了条件

- [x] Job テーブルのマイグレーションが作成されている
- [x] ジョブキューのポート定義が作成されている
- [x] SQLite ジョブキューアダプターが実装されている
- [x] キャプション生成ワーカーが実装されている
- [x] API が非同期レスポンスを返すように変更されている
- [x] ジョブ状態確認 API が追加されている
- [x] ワーカーがサーバー起動時に開始される
- [x] TypeScript 型チェック・ESLint が通る
- [x] 動作確認が完了している

## 作業ログ

| 日時 | 内容 |
|------|------|
| 2026-01-19 | タスク開始、調査・設計 |
| 2026-01-19 | SQLite ベースのジョブキュー実装完了、型チェック・ESLint 通過 |
| 2026-01-19 | 動作確認完了（ジョブ作成 → 状態確認 → ワーカー処理 → 完了確認）|
| 2026-01-19 | フロントエンド非同期ジョブ対応、Web UI での動作確認完了 |
