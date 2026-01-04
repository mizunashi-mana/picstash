# 属性ラベル管理（2-1）

## 目的・ゴール

属性ラベルを作成・編集・削除できるようにする。属性ラベルは画像に付与する分類のための「ラベル」であり、後続セグメント（2-2）で画像にラベル+キーワードを付けられるようになる。

## 実装方針

### データモデル

```prisma
model AttributeLabel {
  id        String   @id @default(uuid())
  name      String   @unique
  color     String?  // 表示色（#RRGGBB 形式）
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

### API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/labels | ラベル一覧取得 |
| POST | /api/labels | ラベル作成 |
| PUT | /api/labels/:id | ラベル更新 |
| DELETE | /api/labels/:id | ラベル削除 |

### UI

- **サイドメニュー**（折りたたみ可能）
  - ナビゲーション項目を配置
  - ラベル管理ページへのリンク
- **ラベル管理ページ**（`/labels`）
  - ラベル一覧表示（色付きバッジ）
  - 新規作成フォーム
    - 名前入力
    - 色: 自動推薦 + ColorPicker で手動選択可能
  - 編集・削除機能

### ディレクトリ構成

```
packages/
├── client/src/features/labels/
│   ├── components/
│   │   ├── LabelList.tsx
│   │   ├── LabelForm.tsx
│   │   └── LabelBadge.tsx
│   ├── pages/
│   │   └── LabelsPage.tsx
│   └── api.ts
├── server/src/infra/http/routes/
│   └── labels.ts
└── shared/src/
    └── labels.ts  # 型定義
```

## 作業項目

1. Prisma スキーマに AttributeLabel モデルを追加
2. マイグレーション実行
3. API エンドポイント実装（CRUD）
4. 共有型定義を追加
5. フロントエンド API クライアント実装
6. UI コンポーネント実装
7. ルーティング追加
8. 動作確認

## 完了条件

- [ ] ラベル一覧が表示される
- [ ] 新規ラベルを作成できる（名前、色）
- [ ] ラベル名を編集できる
- [ ] ラベルを削除できる
- [ ] 同名のラベル作成時にエラーが表示される

## 作業ログ

（実装後に記載）
