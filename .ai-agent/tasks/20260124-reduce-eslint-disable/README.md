# eslint-disable-next-line を減らす

## 目的・ゴール

コード品質向上のため、`eslint-disable-next-line` の使用を可能な限り削減する。

## 現状

86件の `eslint-disable-next-line` が存在。

## 実装方針

### 優先度高（修正する）

1. **`no-non-null-assertion` (14件)**: 型ガードや早期リターンで解消可能なもの
2. **`react-hooks/exhaustive-deps` (3件)**: 実際に依存関係を確認して修正

### 優先度中（検討する）

3. **`no-unsafe-type-assertion` (25件)**: API レスポンス型の改善で解消可能なもの
4. **`no-console` (14件)**: 既存のlogger使用を検討

### 優先度低（そのまま）

5. 型ガードパターンでの type assertion（正当な使用）
6. 外部ライブラリの型定義問題（eslint-config内）
7. テストコード内の expect.any 等

## 完了条件

- [x] 不要な eslint-disable が削除されている
- [x] 正当な理由があるものはコメントで説明が残っている
- [x] lint / typecheck が通る

## 作業ログ

### 2026-01-24

- 現状調査: 92件の eslint-disable-next-line を確認
- 修正実施: 5件削減（92件 → 87件）
  - `react-hooks/exhaustive-deps` (3件): mutate 関数を deps に追加
  - `no-misused-spread` (2件): HeadersInit を Record<string, string> に変更
- 残りの87件は正当な理由があるため維持:
  - 配列ループ内のインデックスアクセス（TypeScript の型システムの限界）
  - React Query の enabled パターン
  - API レスポンスの型アサーション（runtime 検証なしでは不可避）
  - 外部ライブラリの型定義問題
  - no-console（logger 導入は別タスク）
