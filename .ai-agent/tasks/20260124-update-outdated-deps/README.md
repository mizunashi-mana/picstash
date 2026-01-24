# 古くなったライブラリのアップデート

## 目的・ゴール

依存ライブラリを最新バージョンに更新し、セキュリティとメンテナンス性を向上させる。

## 現状分析

### セキュリティ脆弱性（npm audit）

| パッケージ | 深刻度 | 問題 | 修正可否 |
|-----------|--------|------|----------|
| hono | high | JWT algorithm confusion (GHSA-3vhc-576x-3qv4) | ✅ fixAvailable |
| @prisma/dev | high | hono 経由 | ✅ fixAvailable |
| lodash | moderate | chevrotain 経由 | ✅ fixAvailable |
| @mrleebo/prisma-ast | moderate | chevrotain 経由 | ❌ prisma-lint の依存 |

### 古いパッケージ（npm outdated）

主要なアップデート対象:

| パッケージ | Current | Latest | 影響 |
|-----------|---------|--------|------|
| @prisma/* | 7.2.0 | 7.3.0 | ORM |
| @playwright/test | 1.57.0 | 1.58.0 | E2E テスト |
| @storybook/* | 10.1.11 | 10.2.0 | UI ドキュメント |
| vitest | 4.0.17 | 4.0.18 | テスト |
| react-router | 7.12.0 | 7.13.0 | ルーティング |
| zod | 4.3.5 | 4.3.6 | バリデーション |

## 実装方針

1. セキュリティ脆弱性の修正（`npm audit fix`）
2. マイナーバージョンアップデート（wanted version へ）
3. テスト実行で動作確認
4. 型チェック・リント確認

## 完了条件

- [x] `npm audit` で high/critical が 0
- [x] `npm outdated` で wanted = current
- [x] `npm run typecheck` が通る
- [x] `npm run test` が通る
- [x] `npm run lint` が通る

## 作業ログ

### 2026-01-24

1. `npm audit fix` を実行
   - hono の high 脆弱性を修正
   - 残りは moderate (lodash via prisma-lint) のみ - prisma ダウングレードが必要なため対応見送り

2. `npm update` を実行
   - 全パッケージを wanted バージョンに更新
   - @types/node のみ major version アップ (22→25) のため現状維持

3. テスト実行
   - eslint-config のスナップショットテストが失敗（storybook plugin のルール名変更）
   - スナップショットを更新して解決

4. 最終確認
   - typecheck: OK
   - test: OK (268 tests)
   - lint: OK
