# ZIP EOCD エラー修正

## 目的・ゴール

特定の ZIP ファイルで発生する「End of Central Directory Record not found」エラーを修正し、壊れた ZIP ファイルでも部分的に展開できるようにする。

## 背景

- GitHub Issue: #66
- 使用ライブラリ: `yauzl-promise`（セントラルディレクトリを読む方式）
- エラーメッセージ: `End of Central Directory Record not found`

## 原因

`yauzl` ライブラリは ZIP ファイル末尾の End of Central Directory Record (EOCD) を読み取って動作する。EOCD が壊れている・欠損している場合、エラーが発生する。

## 実装方針

### フォールバック戦略

1. **yauzl** を優先的に使用（高速・正確）
2. EOCD エラー発生時は **unzipper.Parse()** にフォールバック
   - ローカルファイルヘッダーをスキャンする方式
   - EOCD がなくても部分的に抽出可能

### 実装内容

- `ZipArchiveHandler` に `unzipper` ライブラリを追加
- EOCD エラー検出時にストリーミングモードにフォールバック
- 壊れたアーカイブのパスをキャッシュし、以降は直接ストリーミングモードを使用

## 完了条件

- [x] EOCD エラー発生時にフォールバック処理が動作する
- [x] 壊れた ZIP からエントリ一覧を取得できる
- [x] 壊れた ZIP からファイルを抽出できる
- [x] テストが追加されている
- [x] ESLint がパスする

## 作業ログ

### 2026-01-24

1. 現状調査
   - ZIP ハンドラ: `packages/server/src/infra/adapters/zip-archive-handler.ts`
   - 使用ライブラリ: `yauzl-promise`

2. エラー再現
   - 正常な ZIP を作成し、末尾を切り詰めて EOCD を削除
   - yauzl: エラー発生
   - unzipper.Parse(): 正常にエントリ検出・抽出可能

3. 実装
   - `unzipper` パッケージを追加
   - `listEntriesWithStreaming()` / `extractEntryWithStreaming()` を追加
   - EOCD エラー時にフォールバック

4. テスト追加
   - 壊れた ZIP に対するテストケースを3件追加
   - 全12件のテストがパス
