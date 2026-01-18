# 検索履歴保存と検索補完への活用

## 目的・ゴール

ユーザーの検索履歴を保存し、検索補完のサジェストに活用することで、過去に入力した検索ワードを簡単に再利用できるようにする。

## 現状分析

- 検索補完（セグメント 7-1）は既に実装済み
  - ラベル名とキーワードからサジェストを生成
  - Mantine の Autocomplete コンポーネントを使用
- 検索履歴のテーブルは存在しない
- 閲覧履歴（ViewHistory）は存在するが、検索クエリは保存していない

## 実装方針

### 1. データベース設計

新しいテーブル `SearchHistory` を追加：

```prisma
model SearchHistory {
  id         String   @id @default(uuid())
  query      String   @unique
  searchedAt DateTime @default(now()) @map("searched_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([searchedAt])
  @@map("search_history")
}
```

### 2. サーバー側実装

- 検索実行時に検索履歴を保存する API を追加
- 検索サジェスト API を拡張して、履歴からもサジェストを取得
- サジェストの種別に `history` を追加

### 3. クライアント側実装

- 検索実行時に履歴を保存
- サジェスト表示で履歴を区別（アイコン・色で区別）
- 履歴の削除機能（サジェスト内に削除ボタン、履歴管理メニュー）

### サジェストの優先順位

1. 検索履歴（直近でマッチするもの）
2. ラベル名
3. キーワード

## 完了条件

- [x] SearchHistory テーブルが作成されている
- [x] 検索実行時に履歴が保存される
- [x] 検索サジェストに履歴が表示される
- [x] 履歴は他のサジェスト種別と視覚的に区別できる
- [x] 重複する履歴は保存されない（既存の履歴を更新）
- [x] 履歴の個別削除ができる
- [x] 履歴の全削除ができる
- [x] TypeScript 型チェック・ESLint が通る

## 作業ログ

| 日時 | 内容 |
|------|------|
| 2026-01-18 | タスク開始、調査完了、README 作成 |
| 2026-01-18 | 実装完了（DB、API、UI すべて） |
