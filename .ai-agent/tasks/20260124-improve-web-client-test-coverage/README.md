# web-client テストカバレッジ改善

## 目的・ゴール

web-client パッケージのテストカバレッジを向上させ、vitest.config.ts の exclude リストから可能な限り多くのファイルを削除する。

## 現状分析

### 現在の exclude リスト

```typescript
exclude: [
  // エントリーポイント
  'src/main.tsx',
  'src/vite-env.d.ts',
  // Storybook ファイル
  'src/**/*.stories.tsx',
  // 全 feature（テスト未実装）
  'src/features/**/*.{ts,tsx}',
  // API クライアント（テスト未実装）
  'src/api/**/*.ts',
  // ルーティング
  'src/routes/**/*.tsx',
  // 共有コンポーネント・フック（テスト未実装）
  'src/shared/components/**/*.{ts,tsx}',
  'src/shared/hooks/**/*.{ts,tsx}',
  // App コンポーネント
  'src/App.tsx',
  // インデックスファイル
  'src/**/index.ts',
]
```

### 既存テスト

- `tests/helpers/url.test.ts` - 13 テストケース (buildUrl 関数)

### テスト対象候補（優先度順）

1. **shared/hooks** - ロジック中心でテストしやすい
   - `use-view-mode.ts` - ビューモード切り替えフック

2. **features の純粋ロジック**
   - `jobs/utils.ts` - ユーティリティ関数
   - `jobs/context.tsx` - コンテキスト（モック必要）
   - `view-history/useViewHistory.ts` - 履歴管理フック

3. **API クライアント** - 型とリクエスト構造のテスト
   - `api/client.ts` - API クライアント設定

4. **コンポーネント** - Storybook 活用か、React Testing Library
   - 複雑な UI ロジックを持つコンポーネント

## 実装方針

1. 純粋関数・フックから着手（モック最小限）
2. テスト追加後、exclude から該当パターンを削除
3. カバレッジ閾値（80%）を満たすことを確認
4. CI でテストが通ることを確認

## 完了条件

- [ ] shared/hooks のテストを追加し exclude から削除
- [ ] features 内のユーティリティ関数のテストを追加
- [ ] exclude リストを縮小
- [ ] CI がパス

## 作業ログ

（実装中に記録）
