# FSD Pages レイヤー分離（残りページ）— T7

## 目的・ゴール

- features レイヤーに残っているページコンポーネントを pages レイヤーに移動する
- FSD のレイヤー構造を完成させる（全ページが pages/ 配下に存在する状態）
- 複雑なページには View Props パターンを適用する

## 背景

T6 で GalleryPage と ImageDetailPage を pages レイヤーに分離済み。残り 8 ページ（6 features）がまだ features 内の `pages/` にある。

## 対象ページ

| 移動元 | 移動先 | View Props | 理由 |
|--------|--------|:----------:|------|
| features/home/pages/HomePage | pages/home/ | 不要 | ハンドラ1つ、状態なし |
| features/labels/pages/LabelsPage | pages/labels/ | 不要 | ハンドラ3つだが状態遷移は mutations のみ |
| features/import/pages/ImportPage | pages/import/ | 不要 | 状態なし、タブ委譲のみ |
| features/view-stats/pages/StatsPage | pages/stats/ | 不要 | ハンドラ1つ（setDays）、状態1つ |
| features/find-duplicates/pages/DuplicatesPage | pages/duplicates/ | **適用** | 状態4つ、ハンドラ5+ |
| features/collections/pages/CollectionsPage | pages/collections/ | 不要 | ハンドラ2つ、状態は単純 |
| features/collections/pages/CollectionDetailPage | pages/collections/ | **適用** | 状態4つ、ハンドラ5+ |
| features/collections/pages/CollectionViewerPage | pages/collections/ | **適用** | ナビゲーション状態 + キーボード操作、ハンドラ3つ |

View Props 適用基準: 「状態遷移が複数あり、ハンドラが3つ以上」

## 実装方針

### ステップ

1. ブランチ作成
2. pages/ ディレクトリ作成 + ページファイルを git mv
3. 単純ページ（5ページ）: 移動 + インポートパス修正
4. View Props 適用ページ（3ページ）: View/Hook 分離 + 移動
5. features/ index.ts からページエクスポートを削除
6. pages/ に index.ts を作成
7. app/routes/index.tsx のインポートを pages/ に変更
8. features/ から空になった pages/ ディレクトリを削除
9. 検証: typecheck, ESLint, dependency-cruiser, Storybook, test:coverage
10. vitest.config.ts のカバレッジ除外パスを更新

### インポートパス変更方針

- ページコンポーネント内の `@/features/X/` インポートはそのまま維持（pages → features は FSD で許可された依存方向）
- ページ内の相対パス（`../ui/`, `../api/`）は `@/features/X/` 絶対パスに変更

### View Props パターン

```
XxxPage.tsx              — useXxxPageViewProps + XxxPageView の統合
XxxPageView.tsx          — ViewProps のみを受け取る純粋な描画
useXxxPageViewProps.ts   — State / Handler / Selector
```

## 完了条件

- [x] features/ 内に pages/ ディレクトリが存在しない
- [x] pages/ レイヤーに全 8 ページが配置されている
- [x] DuplicatesPage, CollectionDetailPage, CollectionViewerPage に View Props 適用
- [x] routes から pages/ 経由でインポートされている
- [x] typecheck, ESLint, dependency-cruiser が通る
- [x] Storybook が正常に動作する（73 tests passed）
- [x] test:coverage が通る（249 tests passed）

## 作業ログ

### 実施内容

1. **単純ページ移動（5ページ）**: git mv で features/ → pages/ に移動
   - HomePage → pages/home/ui/
   - LabelsPage → pages/labels/ui/
   - ImportPage → pages/import/ui/
   - StatsPage → pages/stats/ui/
   - CollectionsPage → pages/collections/ui/

2. **View Props 適用（3ページ）**: Container/View/Hook の3ファイル構成で新規作成
   - DuplicatesPage → pages/duplicates/ui/ (3ファイル)
   - CollectionDetailPage → pages/collections/ui/ (3ファイル)
   - CollectionViewerPage → pages/collections/ui/ (3ファイル)

3. **index.ts 作成**: 全6つの新規 pages スライスに index.ts を作成

4. **routes 更新**: app/routes/index.tsx の全インポートを pages/ 経由に変更

5. **features 整理**:
   - features/collections/index.ts, api.ts 削除（dead code）
   - features/find-duplicates/index.ts 削除（dead code）
   - features/labels/index.ts 削除（dead code）
   - features/view-stats/index.ts 削除（ページのみ export していた）
   - features/import/index.ts 削除（ページのみ export していた）
   - features/home/ ディレクトリ全体削除（ページのみだった）
   - 空の pages/ ディレクトリを全て削除

6. **vitest.config.ts 更新**: カバレッジ除外パスを features/ → pages/ に変更

7. **テストファイル更新**: tests/features/import/ImportPage.test.tsx のインポートパスを修正

### dependency-cruiser 対応

ページ移動後に `not-reachable-from-main` 違反が4件発生。
原因: pages/ が features/ の内部モジュールを直接インポートするようになり、feature の index.ts 経由のインポートがなくなったため。
対応: 不要になった feature index.ts と api.ts を削除し、148 modules / 413 deps で違反0件を達成。
