# desktop-app-coverage-reduction

## 目標
- vitest.config.ts の coverage.exclude を削除する
- 除外していたファイルについて、テスト可能なものはテストを追加する
- テスト困難なファイルは `/* v8 ignore ... */` コメントで部分的に無効化する

## 完了条件
- vitest.config.ts の coverage.exclude が最小限になる（理想は `index.ts` のみ）
- 現在のカバレッジ閾値（lines: 70, branches: 70, functions: 65, statements: 70）を維持
- 全テストが通る

## スコープ

### やること
- 現在除外されているファイルの分析
- テスト追加可能なファイルへのテスト追加
- Electron 依存でテスト困難な箇所への v8 ignore コメント追加
- vitest.config.ts の exclude リスト削減

### やらないこと
- カバレッジ閾値の変更
- renderer 側のテスト追加（別プロジェクト）
- 既存テストの変更

## 現状分析

### 現在の exclude リスト

```typescript
exclude: [
  'src/**/index.ts',           // re-export のみ → 維持
  'src/renderer/**/*',         // renderer 全体 → 維持（別プロジェクト）
  'src/**/*.stories.tsx',      // Storybook → 維持
  'src/main/infra/**/*',       // Prisma 実装 → 除去可能
  'src/main/ipc/**/*',         // IPC ルーター → 除去可能
  'src/main/ipc-handlers.ts',  // IPC ハンドラ → 除去可能
  'src/main/protocol-handler.ts', // カスタムプロトコル → 除去可能
  'src/main/services/image-processor.ts', // sharp 依存 → 除去可能
  'src/shared/types.ts',       // 型定義のみ → 維持
]
```

### 各ファイルの分析

| ファイル/ディレクトリ | 行数 | テスト可能性 | 方針 |
|----------------------|------|-------------|------|
| `src/main/infra/**/*` | 多い | 中〜高 | T1: テスト追加 |
| `src/main/ipc/api-router.ts` | 523 | 高 | T2: テスト追加 |
| `src/main/ipc-handlers.ts` | 211 | 低 | T3: v8 ignore |
| `src/main/protocol-handler.ts` | 102 | 低 | T4: v8 ignore |
| `src/main/services/image-processor.ts` | 58 | 高 | T5: テスト追加 |

### テスト追加の優先度判断

1. **テスト追加が容易**
   - `api-router.ts`: CoreContainer をモックすればテスト可能
   - `image-processor.ts`: sharp のモックでテスト可能

2. **テスト追加が中程度**
   - `infra/adapters/*`: Prisma をモックすればテスト可能だが、結合テスト的

3. **テスト追加が困難（v8 ignore 推奨）**
   - `ipc-handlers.ts`: Electron IPC 依存（ipcMain.handle）
   - `protocol-handler.ts`: Electron protocol API 依存

## タスク分解

| ID | タスク | 依存 | 優先度 | 状態 |
|----|--------|------|--------|------|
| T1 | image-processor.ts のテスト追加 | - | 高 | 完了 |
| T2 | api-router.ts のテスト追加 | - | 高 | 完了 |
| T3 | ipc-handlers.ts に v8 ignore 追加 | - | 中 | 完了 |
| T4 | protocol-handler.ts に v8 ignore 追加 | - | 中 | 完了 |
| T5 | infra ディレクトリに v8 ignore 追加 | - | 中 | 完了 |
| T6 | vitest.config.ts の exclude 更新 | T1〜T5 | 高 | 完了 |
| T7 | カバレッジ確認と調整 | T6 | 高 | 完了 |

### 依存関係図

```
T1 ─────┐
T2 ─────┤
T3 ─────┼─→ T6 ─→ T7
T4 ─────┤
T5 ─────┘
```

### 各タスクの詳細

#### T1: image-processor.ts のテスト追加
- 概要: sharp をモックして ImageProcessorService のテストを作成
- 完了条件:
  - `getMetadata()` のテスト（正常系、エラー系）
  - `generateThumbnail()` のテスト（正常系）
  - カバレッジ 70% 以上

#### T2: api-router.ts のテスト追加
- 概要: CoreContainer をモックして API ルーターのテストを作成
- 完了条件:
  - 主要なエンドポイントのテスト（Images, Labels, Collections 等）
  - エラーハンドリングのテスト
  - カバレッジ 70% 以上

#### T3: ipc-handlers.ts に v8 ignore 追加
- 概要: Electron IPC 依存部分に v8 ignore コメントを追加
- 完了条件:
  - 関数全体を `/* v8 ignore start */` / `/* v8 ignore stop */` で囲む

#### T4: protocol-handler.ts に v8 ignore 追加
- 概要: Electron protocol API 依存部分に v8 ignore コメントを追加
- 完了条件:
  - `registerCustomProtocol` と `registerProtocolPrivileges` を v8 ignore で囲む

#### T5: infra ディレクトリに v8 ignore 追加
- 概要: Prisma 実装（adapters, database, di）に v8 ignore コメントを追加
- 完了条件:
  - 各ファイルの関数/クラスを v8 ignore で囲む

#### T6: vitest.config.ts の exclude 更新
- 概要: v8 ignore により不要になった exclude を削除
- 依存理由: T1〜T5 が完了していないと exclude を削除できない
- 完了条件:
  - 以下のみを exclude に残す:
    - `src/**/index.ts`
    - `src/renderer/**/*`
    - `src/**/*.stories.tsx`
    - `src/shared/types.ts`
  - `npm run test:coverage` が成功

#### T7: カバレッジ確認と調整
- 概要: 最終的なカバレッジを確認し、閾値を満たさない場合は調整
- 依存理由: T6 で exclude を更新した後でないと正確なカバレッジが測定できない
- 完了条件:
  - 全ファイルがカバレッジ閾値を満たす
  - 必要に応じて追加テストまたは v8 ignore を追加

## 進捗
- 2026-02-08: プロジェクト開始
- 2026-02-08: T1〜T7 完了、全てのカバレッジ閾値をクリア
- 2026-02-08: vitest exclude を削減し、v8 ignore のみで除外を実現

## 最終カバレッジ

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |   99.09 |     83.1 |   97.87 |   99.08
 main              |   97.36 |    94.11 |   97.67 |   97.35
  core-manager.ts  |     100 |      100 |     100 |     100
  migration-runner |     100 |      100 |     100 |     100
  storage-manager  |      95 |    92.85 |   95.65 |      95
 main/ipc          |     100 |    78.12 |   97.67 |     100
  api-router.ts    |     100 |    78.12 |   97.67 |     100
 main/services     |     100 |    88.88 |     100 |     100
  image-processor  |     100 |      100 |     100 |     100
  upload-service   |     100 |    85.71 |     100 |     100
```

## メモ
- infra ディレクトリは v8 ignore で対応（ユーザー確認済み）
- infra/adapters/* は Prisma の実装であり、結合テスト的
- infra/database/* も Prisma サービス
- infra/di/* は DI 設定のみ
