# web-client に inversify を導入

## 概要

プロジェクト「API クライアントインターフェース」のタスク T2。web-client パッケージに inversify と reflect-metadata を導入し、DI コンテナの基盤を構築する。

関連プロジェクト: [20260205-api-client-interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

- web-client パッケージに inversify を導入する
- DI コンテナの基盤を構築し、将来の API クライアント実装に備える
- React Context + hooks で DI コンテナを利用可能にする

## 実装方針

1. inversify と reflect-metadata をインストール
2. `shared/di/` ディレクトリを作成し、コンテナ設定を配置
3. tsconfig.json に必要な設定を追加（experimentalDecorators, emitDecoratorMetadata）
4. main.tsx で reflect-metadata をインポート
5. React Context + hooks を作成し、コンポーネントから DI コンテナを利用可能にする
6. app/providers に ContainerProvider を追加

## 完了条件

- [x] inversify と reflect-metadata がインストールされている
- [x] `shared/di/container.ts` で inversify Container が作成されている
- [x] `shared/di/react.tsx` で ContainerProvider と useContainer hook が提供されている
- [x] app/providers に ContainerProvider が追加されている
- [x] typecheck が通る
- [x] lint が通る
- [x] Storybook が動作する

## 作業ログ

### 2026-02-05

- タスク開始
- inversify 7.11.0 と reflect-metadata 0.2.2 は既にインストール済みを確認
- tsconfig.base.json に experimentalDecorators/emitDecoratorMetadata が設定済みを確認
- `shared/di/container.ts` 作成: 空の inversify Container を作成
- `shared/di/react.tsx` 作成: ContainerProvider, useContainer hook を実装
- `shared/di/index.ts` 作成: Public API のエクスポート
- `app/main.tsx` に `import 'reflect-metadata'` を追加
- `app/providers/index.tsx` に ContainerProvider を追加
- `shared/index.ts` を更新して di モジュールをエクスポート
- typecheck, lint, Storybook テスト, ユニットテストすべてパス
- タスク完了
