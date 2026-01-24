# 統計表示でグラフのレイアウトが崩れる

GitHub Issue: https://github.com/mizunashi-mana/picstash/issues/65

## 目的・ゴール

統計ダッシュボードのグラフレイアウト崩れを修正し、正しく表示されるようにする。

## 現状の問題

1. コンソールに警告が出ている: `The width(-1) and height(-1) of chart should be greater than 0`
2. 「日別レコメンド実績」グラフのレジェンドで「表示回数」が表示されていない（「クリック数」のみ表示）
3. グラフの初期レンダリング時にサイズ計算が正しく行われていない可能性

## 原因

- レジェンドが2行になる場合（2つのシリーズがある場合）、`legendProps.height: 50` では高さが足りない
- Card コンポーネントの `overflow: hidden` により、はみ出したレジェンドが切り取られていた
- コンソール警告は Recharts/Mantine Charts の既知の問題（初回レンダリング時のタイミング）

## 実装方針

1. Mantine Charts の `legendProps.height` を増やしてレジェンドが収まるようにする
2. Grid.Col に `minWidth: 0` を追加してサイズ計算を改善

## 完了条件

- [x] 両方のグラフでレジェンドが正しく表示される
- [ ] コンソール警告が解消される（Recharts の既知問題のため対応困難）
- [x] グラフのレイアウトが崩れずに表示される

## 修正内容

1. `RecommendationTrendsChart.tsx`: `legendProps.height` を 50 → 110 に変更
2. `ViewTrendsChart.tsx`: `legendProps.height` を 50 → 70 に変更（一貫性のため）
3. `StatsPage.tsx`: Grid.Col に `style={{ minWidth: 0 }}` を追加

## 作業ログ

### 2026-01-24

- Issue 確認
- 現状のコードと画面を確認
- 問題点を特定：レジェンドの表示切れ、サイズ計算の警告
- 原因調査：
  - レジェンド項目が Card からはみ出していることを確認
  - 「表示回数」の bottom=636 > Card の bottom=585
- 修正実施：
  - `legendProps.height` を増やして2行のレジェンドが収まるように
  - Grid.Col に `minWidth: 0` を追加
- 動作確認：レジェンドが正しく表示されることを確認
- lint / typecheck パス
- PR作成: https://github.com/mizunashi-mana/picstash/pull/94
