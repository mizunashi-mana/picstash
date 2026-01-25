# 設定読み込みをグローバル変数から DI パターンに移行

## 目的・ゴール

設定の読み込みをグローバル変数から DI パターンに移行し、テスタビリティと保守性を向上させる。

## 背景

現在の問題:
- グローバル状態のためモックが難しい
- テスト間で状態が共有されてしまう
- どのモジュールがどの設定を使用しているか追いにくい

## 現状分析

`getConfig()` の使用箇所:
1. `index.ts` - エントリポイント（これは OK）
2. `infra/adapters/sharp-image-processor.ts` - storagePath を取得
3. `infra/di/container.ts` - ollama の設定確認
4. `infra/llm/ollama-llm-service.ts` - ollama URL/モデル取得
5. `infra/adapters/local-file-storage.ts` - storagePath を取得
6. `infra/adapters/in-memory-archive-session-manager.ts` - storagePath を取得

## 実装方針

1. **Config を DI コンテナに登録**
   - `TYPES.Config` を追加
   - `container.ts` で Config をバインド

2. **各サービスでコンストラクタ注入**
   - `@inject(TYPES.Config)` でコンストラクタに注入
   - `getConfig()` の直接呼び出しを削除

3. **グローバル変数の廃止**
   - `loadedConfig` を削除
   - `initConfig` で設定を読み込み、コンテナに渡す

## 完了条件

- [ ] Config が DI コンテナに登録されている
- [ ] 全サービスがコンストラクタ注入で Config を受け取る
- [ ] `getConfig()` のグローバル呼び出しがなくなる
- [ ] テストが通る
- [ ] ビルドが成功する

## 作業ログ

（作業中に更新）
