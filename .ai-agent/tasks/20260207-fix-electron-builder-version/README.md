# electron-builder のバージョン解決エラー修正

## 目的・ゴール

GitHub Actions の CD ワークフロー（cd-desktop-release.yml）で発生している electron-builder のエラーを修正する。

## エラー内容

```
Cannot compute electron version from installed node modules - none of the possible electron modules are installed and version ("^40.1.0") is not fixed in project.
```

## 原因

- `package.json` で Electron バージョンが `^40.1.0` と範囲指定されている
- CI 環境で `npm ci` 後、electron-builder がバージョンを解決できない
- electron-builder は固定バージョンまたは明示的な設定を必要とする

## 実装方針

`electron-builder.json` に `electronVersion` を明示的に指定する。これにより：
- `package.json` の依存関係は柔軟性を保てる
- electron-builder が確実にバージョンを解決できる

## 完了条件

- [ ] electron-builder.json に electronVersion を追加
- [ ] ローカルでパッケージビルドが成功することを確認
- [ ] CI でビルドが成功することを確認

## 作業ログ

- 2026-02-07: タスク開始、エラー原因を特定
