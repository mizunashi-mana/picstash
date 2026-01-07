# タスク: 検索 (2-4)

## 目的・ゴール

属性・説明・キーワードで画像を検索できる機能を実装する。ユーザーがライブラリ内の画像を素早く見つけられるようにする。

## 実装方針

### 検索対象フィールド

- `Image.filename` - ファイル名
- `Image.description` - 説明文
- `ImageAttribute.keywords` - 属性のキーワード
- `AttributeLabel.name` - 属性ラベル名

### バックエンド

- `GET /api/images` にクエリパラメータ `q` を追加
  - `q` が指定された場合、検索を実行
  - `q` が空または未指定の場合、全件返却（既存動作）
- SQLite の LIKE 検索を使用（シンプルな部分一致）
- 将来的に sqlite-vec でベクトル検索に拡張可能な設計

### フロントエンド

- ギャラリーページに検索バーを追加
- 検索クエリは URL のクエリパラメータに反映（ブックマーク可能）
- デバウンスで API 呼び出しを最適化
- 検索結果が0件の場合のメッセージ表示

### UI/UX

- ヘッダー下部に検索バーを配置
- Enter キーまたは一定時間入力停止で検索実行
- 検索中はローディング表示
- 検索結果件数を表示

## 完了条件

- [ ] `GET /api/images?q=xxx` で検索できる
- [ ] filename, description, keywords, label.name を横断検索
- [ ] ギャラリーページに検索バーが表示される
- [ ] 検索クエリが URL に反映される
- [ ] 検索結果が0件の場合に適切なメッセージが表示される
- [ ] Lint・型チェックが通る
- [ ] 既存のテストが壊れていない

## 作業ログ

### 2026-01-08

1. **ImageRepository 更新**: `search(query: string)` メソッドを追加
   - filename, description, keywords, label.name を OR 条件で検索
   - Prisma の `contains` と `some` を使用
2. **GET /api/images 更新**: クエリパラメータ `q` 対応
   - `q` 指定時は検索、未指定時は全件返却
3. **フロントエンド API 更新**: `fetchImages(query?)` に検索パラメータ追加
4. **SearchBar コンポーネント作成**: デバウンス付き検索入力
5. **ImageGallery 更新**: URL クエリパラメータ `?q=` と連動
6. **ImageGalleryView 更新**: 検索バー表示、結果件数表示、0件メッセージ
7. **動作確認**: curl で API テスト、Playwright でブラウザ確認
   - 検索結果の絞り込み確認
   - URL パラメータ反映確認
   - 0件時メッセージ確認
