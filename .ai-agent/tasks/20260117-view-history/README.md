# タスク 6-1: 閲覧履歴記録

## 目的・ゴール

画像の閲覧履歴を自動的に記録する機能を実装する。将来の推薦機能の基盤となる。

## 提供価値

- どの画像をいつ見たかが記録される
- 各画像をどのくらいの時間見ていたかが分かる
- 閲覧回数が記録される

## 実装方針

### データモデル

```prisma
model ViewHistory {
  id        String   @id @default(uuid())
  imageId   String
  image     Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  viewedAt  DateTime @default(now())
  duration  Int?     // 滞在時間（ミリ秒）、終了時に更新
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([imageId])
  @@index([viewedAt])
}
```

### API 設計

1. **閲覧開始記録** `POST /api/view-history`
   - 画像詳細ページを開いた時に呼び出す
   - レスポンスで viewHistoryId を返す

2. **閲覧終了記録** `PATCH /api/view-history/:id`
   - ページを離れる時に duration を更新
   - `visibilitychange` イベントで送信

3. **閲覧履歴取得** `GET /api/view-history`
   - 最近見た画像一覧を取得
   - ページネーション対応

4. **画像の閲覧統計** `GET /api/images/:id/view-stats`
   - 特定画像の閲覧回数・合計時間を取得

### フロントエンド

1. **ImageDetailPage に組み込み**
   - マウント時に閲覧開始を記録
   - アンマウント時・ページ離脱時に終了を記録
   - `useViewHistory` カスタムフック

2. **閲覧履歴ページ（オプション）**
   - 最近見た画像の一覧表示

## 完了条件

- [x] ViewHistory モデルが作成されている
- [x] 閲覧開始・終了の API が実装されている
- [x] 画像詳細ページで自動的に閲覧が記録される
- [x] 滞在時間が正しく記録される

## 作業ログ

### 2026-01-17

- ViewHistory モデルを Prisma スキーマに追加
  - Image との関連付け (onDelete: Cascade)
  - imageId, viewedAt にインデックス追加
- マイグレーション実行
  - sqlite-vec 拡張テーブルが原因で Prisma migrate が失敗
  - 手動で view_history テーブルを作成して対応
- ViewHistory リポジトリを実装 (Clean Architecture)
  - domain/view-history: ドメイン型定義
  - application/ports/view-history-repository.ts: ポートインターフェース
  - infra/adapters/prisma-view-history-repository.ts: Prisma 実装
  - DI コンテナに登録
- 閲覧履歴 API を実装
  - POST /api/view-history: 閲覧開始記録
  - PATCH /api/view-history/:id: 閲覧終了記録 (duration 更新)
  - GET /api/view-history: 閲覧履歴一覧取得
  - GET /api/images/:id/view-stats: 画像別閲覧統計
- フロントエンドを実装
  - features/view-history/api.ts: API クライアント
  - features/view-history/useViewHistory.ts: カスタムフック
    - マウント時に閲覧開始を記録
    - アンマウント時・visibilitychange 時に閲覧終了を記録
    - beforeunload 時は sendBeacon で確実に送信
  - ImageDetailPage に useViewHistory フックを組み込み
- 動作確認完了
