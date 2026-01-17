# UIの日本語化

## 目的・ゴール

クライアント側UIの英語テキストを日本語に翻訳し、一貫した日本語UIを提供する。

## 背景

- 現在、UIの一部が英語、一部が日本語で混在している
- 22ファイルに英語テキストが含まれている
- 一部のファイル（7ファイル）は既に完全に日本語化済み

## 実装方針

### アプローチ: 直接置換

i18nフレームワーク（react-i18nextなど）は導入せず、直接テキストを日本語に置換する。

**理由:**
- 単一言語（日本語）のみをサポートするため、多言語対応の複雑さは不要
- 既存の日本語化済みファイルも直接置換方式
- シンプルで保守しやすい

### 対象ファイル（22ファイル）

1. **共通レイアウト**
   - `shared/components/AppLayout.tsx` - ナビゲーション

2. **ホーム**
   - `features/home/pages/HomePage.tsx`

3. **ギャラリー**
   - `features/gallery/components/ImageGalleryView.tsx`
   - `features/gallery/components/ImageAttributeSectionView.tsx`
   - `features/gallery/pages/ImageDetailPage.tsx`

4. **ラベル管理**
   - `features/labels/components/LabelForm.tsx`
   - `features/labels/components/LabelList.tsx`
   - `features/labels/pages/LabelsPage.tsx`

5. **コレクション**
   - `features/collections/pages/CollectionsPage.tsx`
   - `features/collections/pages/CollectionDetailPage.tsx`
   - `features/collections/pages/CollectionViewerPage.tsx`

6. **重複検出**
   - `features/duplicates/pages/DuplicatesPage.tsx`
   - `features/duplicates/components/DuplicateGroupCard.tsx`

7. **アーカイブインポート**
   - `features/archive-import/pages/ArchiveImportPage.tsx`
   - `features/archive-import/components/ArchivePreviewGallery.tsx`

8. **統計**
   - `features/stats/pages/StatsPage.tsx`
   - `features/stats/components/StatsOverviewCards.tsx`
   - `features/stats/components/PopularImagesList.tsx`
   - `features/stats/components/ViewTrendsChart.tsx`
   - `features/stats/components/RecommendationTrendsChart.tsx`

### 翻訳ルール

- **ボタン**: Cancel→キャンセル, Create→作成, Delete→削除, Edit→編集, Save→保存
- **エラー**: Error→エラー, Failed to X→Xに失敗しました
- **状態**: Loading→読み込み中, No X found→Xが見つかりません
- **複数形**: images/views等→単純に「枚」「回」で統一
- **アプリ名**: Picstash は変更しない（ブランド名）

## 完了条件

- [ ] 22ファイルの英語テキストを日本語に置換
- [ ] ブラウザで動作確認（主要画面）
- [ ] 型チェック・リントが通る

## 作業ログ

### 2026-01-17

- タスク開始
- クライアント側UIを調査、22ファイルに英語テキストを特定
