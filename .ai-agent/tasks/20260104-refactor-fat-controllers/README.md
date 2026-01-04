# Fat Controller のリファクタリング

## 目的

ルートファイル（controllers）に集中しているビジネスロジックを適切なレイヤーに分離し、コードの保守性・テスト容易性を向上させる。

## 現状の問題

### images.ts (229行)
- アップロード処理にファイル検証、メタデータ取得、サムネイル生成、DB保存が混在
- ファイル配信ロジックが重複（file / thumbnail）
- ヘルパー関数 `fileExists` がルート内に定義

### image-attributes.ts (197行)
- キーワード正規化ロジックが重複（POST/PUT で同じコード）
- 画像存在チェック、属性存在チェックが各エンドポイントで重複

### labels.ts (141行)
- 名前検証・重複チェックロジックがルート内に直接記述

## 実装方針

### 1. Application 層（ユースケース）の導入

```
packages/server/src/application/
├── image/
│   ├── upload-image.ts      # 画像アップロードユースケース
│   └── delete-image.ts      # 画像削除ユースケース
├── label/
│   ├── create-label.ts      # ラベル作成ユースケース
│   └── update-label.ts      # ラベル更新ユースケース
└── image-attribute/
    ├── add-attribute.ts     # 属性追加ユースケース
    └── update-attribute.ts  # 属性更新ユースケース
```

### 2. 共通ヘルパーの抽出

```
packages/server/src/shared/
├── validators/
│   └── string-validators.ts  # 文字列検証（空文字チェック等）
└── normalizers/
    └── keyword-normalizer.ts # キーワード正規化
```

### 3. ルートの責務を限定

- HTTP リクエスト/レスポンスの処理のみ
- ユースケース呼び出しとエラーハンドリング
- 50行程度を目標

## 完了条件

- [ ] images.ts が 100行以下になる
- [ ] image-attributes.ts が 80行以下になる
- [ ] labels.ts が 60行以下になる
- [ ] 重複コードが解消される
- [ ] 既存のテストが通る（あれば）
- [ ] lint/typecheck が通る

## 作業ログ

（実装中に記録）
