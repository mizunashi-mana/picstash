# タスク 1-2: ギャラリー表示

## 目的・ゴール

登録した画像を一覧で見れるようにする。ホームページに画像のギャラリーを表示し、アップロード後に自動で一覧が更新される。

## 現状

- **バックエンド**: `GET /api/images` API が既に実装済み（`findAllImages` で作成日時の降順で取得）
- **フロントエンド**: アップロード機能のみ。ギャラリー表示は未実装

## 実装方針

### 1. API 層（クライアント）
- `packages/client/src/features/gallery/api.ts` を作成
- 画像一覧取得の API 関数を実装

### 2. ギャラリーコンポーネント
- `packages/client/src/features/gallery/components/ImageGallery.tsx` を作成
- Mantine の SimpleGrid でグリッド表示
- 各画像はカード形式で表示（画像＋ファイル名）
- TanStack Query で API 呼び出し・キャッシュ管理

### 3. ホームページ統合
- `HomePage.tsx` にギャラリーコンポーネントを追加
- アップロード成功時にギャラリーを自動更新（invalidateQueries）

### 4. 画像配信 API
- `GET /api/images/:id/file` を追加して画像ファイルを配信
- 現状 `/storage/originals/` のパスを直接参照できないため必要

## 完了条件

- [x] ホームページに画像ギャラリーが表示される
- [x] アップロードした画像がギャラリーに表示される
- [x] アップロード後、ギャラリーが自動更新される
- [x] 画像がない場合は空状態メッセージが表示される
- [x] lint・typecheck がパスする

## 作業ログ

### 2026-01-04

1. **画像配信 API を追加**
   - `GET /api/images/:id/file` エンドポイントを追加
   - `packages/server/src/infra/http/routes/images.ts` を更新
   - キャッシュヘッダー付きでストリーム配信

2. **ギャラリー feature を作成**
   - `packages/client/src/features/gallery/api.ts` - 画像一覧取得 API
   - `packages/client/src/features/gallery/components/ImageGallery.tsx` - グリッド表示
   - `packages/client/src/features/gallery/index.ts` - エクスポート

3. **HomePage に統合**
   - ギャラリーコンポーネントを追加
   - アップロード成功時に `invalidateQueries` でギャラリー自動更新

4. **動作確認**
   - ブラウザで画像ギャラリーが正常に表示されることを確認
   - lint・typecheck がパスすることを確認
