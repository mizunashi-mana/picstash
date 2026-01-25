# React Compiler の導入

## 目的・ゴール

React Compiler（React Forget）を導入し、手動での useMemo / useCallback の最適化を自動化する。

## 背景

- 現在、パフォーマンス最適化のために手動で useMemo や useCallback を使用している
- React Compiler により、これらの最適化を自動で行えるようになる
- コードの可読性向上とメンテナンス負担の軽減が期待できる

## 実装方針

1. `babel-plugin-react-compiler` をインストール
2. `vite.config.ts` の `@vitejs/plugin-react` に Babel 設定を追加
3. 動作確認

## 完了条件

- [x] babel-plugin-react-compiler がインストールされている
- [x] Vite 設定に React Compiler が追加されている
- [x] ビルドが成功する
- [x] 開発サーバーが正常に動作する
- [x] テストが通る

## 技術メモ

現在の環境:
- React 19.1.0
- Vite 7.0.4
- @vitejs/plugin-react 5.1.2

## 作業ログ

- babel-plugin-react-compiler をインストール
- vite.config.ts に React Compiler の Babel 設定を追加
- ビルド成功を確認
- テスト成功を確認（82 tests passed）
- typecheck 成功を確認
- lint 成功を確認
