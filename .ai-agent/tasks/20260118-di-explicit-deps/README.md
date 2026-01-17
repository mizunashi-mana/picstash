# DI コンテナの直接引き渡しをやめる

## 目的・ゴール

各ルートファイルが `AppContainer` 全体を受け取るのをやめ、クラスベースの Controller に変更して inversify によるコンストラクタインジェクションを使用する。

**Before:**
```typescript
export function imageRoutes(app: FastifyInstance, container: AppContainer): void {
  const imageRepository = container.getImageRepository();
  const fileStorage = container.getFileStorage();
  // ...
}
```

**After:**
```typescript
@injectable()
export class ImageController {
  constructor(
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.FileStorage) private readonly fileStorage: FileStorage,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // ...
  }
}
```

## 実装方針

1. 各ルートファイルを Controller クラスに変換
2. `@injectable()` デコレータでクラスを登録
3. コンストラクタで `@inject()` を使って依存を注入
4. `AppContainer` に Controller 取得メソッドを追加
5. `routes/index.ts` で Controller を取得してルート登録

## 完了条件

- [x] 全ルートファイル（10ファイル）が Controller クラスに変換される
- [x] 依存がコンストラクタインジェクションで注入される
- [x] `AppContainer` の直接参照がルート登録ロジックから除去される
- [x] 既存のテストがパスする
- [x] 型チェック・lint がパスする

## 対象ルートファイル

1. ~~images.ts~~ → ImageController ✅
2. ~~image-attributes.ts~~ → ImageAttributeController ✅
3. ~~labels.ts~~ → LabelController ✅
4. ~~collections.ts~~ → CollectionController ✅
5. ~~archives.ts~~ → ArchiveController ✅
6. ~~view-history.ts~~ → ViewHistoryController ✅
7. ~~recommendations.ts~~ → RecommendationController ✅
8. ~~recommendation-conversions.ts~~ → RecommendationConversionController ✅
9. ~~stats.ts~~ → StatsController ✅
10. ~~search.ts~~ → SearchController ✅
11. health.ts（依存なし、変更不要）

## 作業ログ

### 2026-01-18

- `TYPES` に Controller シンボルを追加
- 10個の Controller クラスを作成:
  - `ImageController` - 画像CRUD、アップロード、類似画像検索、重複検出など
  - `ImageAttributeController` - 画像属性の追加・更新・削除
  - `LabelController` - ラベルCRUD
  - `CollectionController` - コレクションCRUD、画像の追加・削除・順序変更
  - `ArchiveController` - アーカイブアップロード、プレビュー、インポート
  - `ViewHistoryController` - 閲覧履歴の記録・取得
  - `RecommendationController` - レコメンデーション生成
  - `RecommendationConversionController` - レコメンデーションコンバージョン追跡
  - `StatsController` - 統計情報取得
  - `SearchController` - 検索サジェスト
- `container.ts` に Controller バインディングを追加
- `AppContainer` に Controller 取得メソッドを追加
- `routes/index.ts` を更新して Controller を使用するように変更
- 古いルートファイル（10ファイル）を削除
- 型チェック、Lint、テスト（172件）すべてパス
