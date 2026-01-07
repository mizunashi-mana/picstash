# タスク: 画像説明 (2-3)

## 目的・ゴール

画像に説明文を付けられる機能を実装する。ユーザーが画像の内容や補足情報をテキストで記録できるようにする。

## 実装方針

### データモデル

- Image モデルに `description` フィールドを追加（nullable な String）

### バックエンド (Fastify)

- `PATCH /api/images/:id` エンドポイントを追加
  - `description` フィールドを更新可能にする
- 既存の `GET /api/images/:id` で description を返す

### フロントエンド (React)

- 画像詳細ページ (`ImageDetailPage`) に説明セクションを追加
  - 説明文の表示
  - 説明文の編集機能（インライン編集 or モーダル）
- API クライアントに更新メソッドを追加

### UI/UX

- 説明がない場合は「説明を追加」ボタンを表示
- 編集中は Textarea を表示
- 保存・キャンセルボタン
- オートセーブは行わず、明示的な保存ボタンで保存

## 完了条件

- [ ] Image モデルに description フィールドが追加されている
- [ ] マイグレーションが正常に適用される
- [ ] `GET /api/images/:id` で description が返される
- [ ] `PATCH /api/images/:id` で description を更新できる
- [ ] 画像詳細ページで説明文を表示できる
- [ ] 画像詳細ページで説明文を編集・保存できる
- [ ] Lint・型チェックが通る
- [ ] 既存のテストが壊れていない

## 作業ログ

### 2026-01-08

1. **Prisma スキーマ更新**: Image モデルに `description` フィールド（String?）を追加
2. **マイグレーション適用**: `20260107152555_add_image_description` マイグレーション作成・適用
3. **ImageRepository 更新**:
   - `Image` インターフェースに `description` 追加
   - `UpdateImageInput` インターフェース追加
   - `update` メソッド追加
   - `PrismaImageRepository` に実装
4. **PATCH エンドポイント追加**: `/api/images/:id` で description を更新可能に
5. **フロントエンド API クライアント更新**: `updateImage` 関数追加
6. **ImageDescriptionSection コンポーネント作成**: 説明の表示・編集 UI
7. **ImageDetailPage 更新**: 説明セクションを追加（画像の下、属性の上）
8. **テストデータ修正**: Storybook の mockImages に description 追加
9. **動作確認**: curl で API テスト、型チェック・Lint・テスト全て通過
