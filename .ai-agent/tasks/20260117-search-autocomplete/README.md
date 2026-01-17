# 7-1: 検索ワード補完

## 目的・ゴール

検索入力時に、属性ラベル名・キーワードの候補を表示し、入力補完を実現する。

ユーザーが以下を体験できるようにする：
- 検索欄に文字を入力すると、マッチする候補がドロップダウンで表示される
- 候補をクリック（または Enter）で検索欄に反映される
- ラベル名とキーワードの両方が候補に含まれる

## 実装方針

### バックエンド

1. **検索補完 API の追加**
   - `GET /api/search/suggestions?q={query}` - 補完候補を取得
   - 対象データ:
     - ラベル名（`Label.name`）
     - キーワード（`ImageAttribute.keywords`）
   - 前方一致（prefix match）で検索
   - 重複を除去して返却
   - 結果は最大10件程度に制限

2. **レスポンス形式**
   ```json
   {
     "suggestions": [
       { "type": "label", "value": "風景" },
       { "type": "keyword", "value": "風景画" }
     ]
   }
   ```

### フロントエンド

1. **SearchBar コンポーネントの拡張**
   - `TextInput` を `Autocomplete` に変更
   - 補完候補取得 API を呼び出し
   - 入力ごとに debounce して API 呼び出し（既存の 300ms を活用）

2. **UI 挙動**
   - 1文字以上入力で補完候補を表示
   - 候補をクリックで検索実行
   - キーボード操作（↑↓で選択、Enter で確定）

### 技術選定

- Mantine `Autocomplete` コンポーネント
- TanStack Query で候補をキャッシュ

## 完了条件

- [x] 補完 API が実装され、curl で動作確認できる
- [x] SearchBar が Autocomplete に置き換わっている
- [x] ラベル名・キーワードが候補に表示される
- [x] 候補選択で検索が実行される
- [x] ESLint エラーがない
- [x] TypeScript 型エラーがない

## 作業ログ

### 2026-01-17

1. **バックエンド実装**
   - 検索補完 API (`GET /api/search/suggestions?q={query}`) を実装
   - ラベル名（AttributeLabel.name）を前方一致で検索
   - キーワード（ImageAttribute.keywords）を前方一致で検索
   - 重複排除、最大10件、type（label/keyword）付きで返却

2. **フロントエンド実装**
   - SearchBar を Mantine Autocomplete に変更
   - TanStack Query で補完候補をキャッシュ（30秒）
   - 候補にラベル/キーワードのアイコンを表示
   - 候補選択で検索実行

3. **動作確認**
   - curl で API 動作確認 OK
   - ESLint チェック OK
   - TypeScript 型チェック OK
