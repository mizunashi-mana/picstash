# タスク: 推薦コンバージョン記録

## 目的・ゴール

推薦画像のクリック有無・滞在時間を記録し、推薦精度の向上に活用できるようにする。

## 実装方針

### データモデル

```prisma
model RecommendationConversion {
  id                  String    @id @default(cuid())
  imageId             String
  recommendationScore Float     // 推薦時のスコア
  impressionAt        DateTime  // 推薦が表示された日時
  clickedAt           DateTime? // クリックされた日時（nullならスキップ）
  viewHistoryId       String?   // クリック時の閲覧履歴への参照
  createdAt           DateTime  @default(now())

  image       Image        @relation(fields: [imageId], references: [id], onDelete: Cascade)
  viewHistory ViewHistory? @relation(fields: [viewHistoryId], references: [id], onDelete: SetNull)

  @@index([imageId])
  @@index([impressionAt])
}
```

### API 設計

1. **POST /api/recommendation-conversions/impressions**
   - 推薦表示時にインプレッションを一括記録
   - Body: `{ recommendations: [{ imageId, score }] }`
   - Response: `{ ids: string[] }`

2. **PATCH /api/recommendation-conversions/:id/click**
   - 推薦クリック時に記録
   - Body: `{ viewHistoryId: string }`
   - Response: `RecommendationConversion`

3. **GET /api/recommendation-conversions/stats**
   - コンバージョン統計を取得（6-4 統計ダッシュボード向け）
   - Query: `?days=30`
   - Response: `{ totalImpressions, totalClicks, conversionRate, ... }`

### クライアント側の変更

1. **RecommendationSection**: 推薦表示時にインプレッション記録
2. **推薦画像クリック**: conversionId をクエリパラメータで渡す
3. **useViewHistory**: conversionId があればクリック記録

## 完了条件

- [ ] Prisma スキーマに RecommendationConversion を追加
- [ ] マイグレーション実行
- [ ] サーバー側 API 実装（impressions, click, stats）
- [ ] クライアント側でインプレッション記録
- [ ] クライアント側でクリック記録
- [ ] 動作確認（インプレッション→クリック→閲覧履歴紐付け）
- [ ] テスト追加

## 作業ログ

### 2026-01-17

- タスク開始
