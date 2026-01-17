# 6-4: 統計ダッシュボード

## 目的・ゴール

閲覧傾向・推薦精度を可視化・分析できる統計ダッシュボードを実装する。

ユーザーが以下を確認できるようにする：
- 閲覧履歴の統計（総閲覧数、閲覧時間傾向など）
- 推薦システムの精度（コンバージョン率、クリック率など）
- 時系列での傾向分析

## 実装方針

### バックエンド

1. **統計 API の拡張**
   - `/api/stats/overview` - 全体概要（総画像数、総閲覧数、推薦精度など）
   - `/api/stats/view-trends` - 閲覧傾向（日別・週別の閲覧数推移）
   - `/api/stats/recommendation-trends` - 推薦精度の推移（日別コンバージョン率など）
   - `/api/stats/popular-images` - よく閲覧される画像ランキング

2. **既存の統計機能を活用**
   - `RecommendationConversionRepository.getStats()` - 既存のコンバージョン統計
   - `ViewHistoryRepository.getImageStats()` - 既存の画像別統計

### フロントエンド

1. **新規 feature: `stats`**
   - `StatsPage` - ダッシュボードページ
   - グラフコンポーネント（Mantine Charts を使用）
   - 統計カードコンポーネント

2. **UI 構成**
   - 概要セクション: KPI カード（総閲覧数、コンバージョン率など）
   - 閲覧傾向グラフ: 折れ線グラフで日別推移
   - 推薦精度グラフ: コンバージョン率の推移
   - 人気画像ランキング: サムネイル付きリスト

### 技術選定

- グラフ描画: `@mantine/charts` (Recharts ベース)
- 状態管理: TanStack Query
- 期間選択: Mantine の DatePickerInput または Select

## 完了条件

- [x] 統計 API が実装され、curl で動作確認できる
- [x] ダッシュボードページが実装され、ナビゲーションからアクセスできる
- [x] 概要統計（KPI カード）が表示される
- [x] 閲覧傾向グラフが表示される
- [x] 推薦精度グラフが表示される
- [x] 人気画像ランキングが表示される
- [x] 期間フィルター（7日/30日/90日）が機能する
- [x] ESLint エラーがない
- [x] TypeScript 型エラーがない

## 作業ログ

### 2026-01-17

1. **バックエンド実装**
   - 統計ドメインモデルを作成 (`domain/stats/index.ts`)
   - StatsRepository インターフェースを定義 (`application/ports/stats-repository.ts`)
   - PrismaStatsRepository を実装 (`infra/adapters/prisma-stats-repository.ts`)
   - DI コンテナに登録
   - 統計 API ルートを作成 (`/api/stats/*`)

2. **フロントエンド実装**
   - `@mantine/charts` と `recharts` をインストール
   - stats feature を作成
     - API クライアント (`api.ts`)
     - StatsOverviewCards コンポーネント（KPI カード）
     - ViewTrendsChart コンポーネント（閲覧傾向グラフ）
     - RecommendationTrendsChart コンポーネント（推薦精度グラフ）
     - PopularImagesList コンポーネント（人気画像ランキング）
     - StatsPage（ダッシュボードページ）
   - ルーティングに `/stats` を追加
   - ナビゲーションに Stats リンクを追加

3. **動作確認**
   - curl で API 動作確認 OK
   - ブラウザで UI 動作確認 OK
   - ESLint チェック OK
   - TypeScript 型チェック OK
