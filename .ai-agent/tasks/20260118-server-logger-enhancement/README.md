# サーバーロガー強化

## 目的・ゴール

Fastify サーバーのロギング機能を強化し、以下を実現する：

1. **ファイル出力対応** - ログをファイルに出力し、後から確認できるようにする
2. **ログレベル設定** - 設定ファイル（config.yaml）でログレベルを切り替えられるようにする
3. **リクエストログ強化** - リクエスト/レスポンスの詳細情報（処理時間、ステータスコード等）を記録する
4. **構造化ログ** - JSON 形式で構造化ログを出力し、ログ解析を容易にする

## 現状

- Fastify に pino-pretty を使用したロガーが設定済み
- コンソール出力のみ
- ログレベル設定なし

## 実装方針

### 1. ログ設定の拡張（config.yaml）

```yaml
server:
  port: 4000
  host: 0.0.0.0

logging:
  level: info                    # debug, info, warn, error
  format: pretty                 # pretty（開発用）, json（本番用）
  file:
    enabled: false               # ファイル出力の有効化
    path: ./logs/server.log      # ログファイルパス
    rotation:
      enabled: true              # ログローテーション
      maxSize: 10M               # 最大ファイルサイズ
      maxFiles: 5                # 保持するファイル数
```

### 2. pino の機能活用

- **pino-pretty**: 開発環境での見やすい出力
- **pino/file**: ファイル出力
- **pino-roll**: ログローテーション
- リクエストログは Fastify 組み込みの機能を活用

### 3. リクエストログの内容

- リクエストID（トレーサビリティ用）
- メソッド、URL、クエリパラメータ
- 処理時間
- ステータスコード
- レスポンスサイズ

## 完了条件

- [x] config.yaml でログ設定ができる
- [x] ログレベル（debug/info/warn/error）を切り替えられる
- [x] 開発環境では pretty 形式、本番環境では JSON 形式で出力できる
- [x] ファイル出力ができる（オプション）
- [x] ログローテーションが動作する
- [x] リクエスト/レスポンスの詳細がログに記録される
- [x] 型チェックとリントが通る

## 作業ログ

### 2026-01-18

- タスク開始
- pino-roll パッケージをインストール
- config.ts にロギング設定スキーマを追加
- infra/logging/logger.ts でロガー構成ファクトリを作成
- app.ts で buildLoggerOptions を使用するように変更
- config.yaml にロギング設定のサンプルを追加
- 動作確認完了:
  - コンソール出力（pretty 形式）: OK
  - ファイル出力（JSON 形式 + ローテーション）: OK
  - リクエストログ（reqId, method, url, statusCode, responseTime）: OK
- 型チェック・リント: OK
- タスク完了
