# Task 2-2: 画像属性付与

## 目的・ゴール

画像に属性（ラベル＋複数キーワード）を付けられるようにする。これにより、後続の検索機能（2-4）で画像を見つけやすくなる。

## 実装方針

### データモデル

- `ImageAttribute` 中間テーブルを作成
  - Image と AttributeLabel の多対多リレーション
  - 各ペアに複数のキーワードを保持可能

### バックエンド

- 画像属性 CRUD API
  - `GET /api/images/:id/attributes` - 画像の属性一覧取得
  - `POST /api/images/:id/attributes` - 属性付与（ラベル＋キーワード）
  - `PUT /api/images/:id/attributes/:attributeId` - 属性更新（キーワード変更）
  - `DELETE /api/images/:id/attributes/:attributeId` - 属性削除

### フロントエンド

- 画像詳細ページに属性セクション追加
  - 現在の属性一覧表示
  - ラベル選択・キーワード入力フォーム
  - 属性の編集・削除

## 完了条件

- [ ] ImageAttribute モデルが作成されている
- [ ] 属性 CRUD API が動作する
- [ ] 画像詳細ページで属性を付与・編集・削除できる
- [ ] 型チェック・lint が通る
- [ ] 動作確認完了

## 作業ログ

<!-- 実装時に追記 -->
