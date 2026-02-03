# FSD entities レイヤーから UI コンポーネントを移動 + プロジェクト計画更新

## 目的・ゴール

- entities レイヤーに配置されている UI コンポーネント・ストーリーファイルを適切な FSD レイヤーに移動する
- FSD 移行プロジェクトの計画を更新する（T8 削除、T9 完了確認）
- dependency-cruiser でレイヤー間依存方向を検証する

## 背景

FSD では entities レイヤーはビジネスエンティティの data（型定義）と API（CRUD）が主務。現在 `entities/label/ui/` に LabelBadge, LabelForm, LabelList とその stories が配置されているが、これらは features レイヤーに置くべき。

## 実装方針

### 1. Label UI コンポーネントの移動

**移動元**: `entities/label/ui/` (LabelBadge, LabelForm, LabelList + stories)
**移動先**: `features/labels/ui/`

- `features/labels/` は既に存在し、LabelsPage を含む
- LabelBadge, LabelForm, LabelList は LabelsPage で使用されており、features/labels への配置が自然
- manage-image-attributes が fetchLabels を使っているが、これは entities/label/api のままで問題ない

### 2. プロジェクト計画の更新

- T8（ESLint 依存関係ルール）を削除: dependency-cruiser で十分
- T9（dependency-cruiser ルール）を完了に更新: 既に全ルールが設定済み

## 完了条件

- [x] entities/label/ui/ が存在しない（UI コンポーネント・stories が features に移動済み）
- [x] entities/label/index.ts が型と API のみをエクスポート
- [x] features/labels/ から UI コンポーネントが正しくエクスポートされている
- [x] 全テスト・型チェック・lint・dependency-cruiser が通る
- [x] Storybook が正常に動作する（11 ファイル、73 テスト全パス）
- [x] プロジェクト README.md が更新されている

## 作業ログ

- entities/label/ui/ の 6 ファイルを features/labels/ui/ に git mv で移動
- ストーリーの title を `Entities/Label/` → `Features/Labels/` に更新
- entities/label/index.ts から UI エクスポート 3 行を削除
- features/labels/index.ts に UI エクスポート 3 行を追加
- LabelsPage.tsx のインポートを `@/features/labels/ui/` に変更
- 検証結果: typecheck ✅, ESLint ✅, dependency-cruiser ✅ (142 modules, 407 deps), Storybook ✅ (73 tests)
- プロジェクト計画更新: T8 削除、T9 完了、entities の方針を「型定義 + API のみ」に明記
- structure.md を FSD の現在の状態に更新
