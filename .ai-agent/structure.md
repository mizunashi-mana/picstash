# Picstash ディレクトリ構成

```
picstash/
├── .ai-agent/                  # AI エージェント用ドキュメント
│   ├── steering/               # ステアリングドキュメント
│   │   ├── product.md          # プロダクト概要
│   │   ├── tech.md             # 技術概要
│   │   └── plan.md             # 実装計画
│   ├── tasks/                  # タスクドキュメント
│   │   └── YYYYMMDD-タスク名/   # 各タスクのディレクトリ
│   │       └── README.md       # タスク詳細（目的・方針・完了条件・作業ログ）
│   └── structure.md            # ディレクトリ構成（本ファイル）
│
├── packages/                   # ソースコード
│   ├── client/                 # フロントエンド
│   │   ├── src/
│   │   │   ├── components/     # UI コンポーネント
│   │   │   ├── pages/          # ページコンポーネント
│   │   │   ├── hooks/          # カスタムフック
│   │   │   ├── stores/         # 状態管理
│   │   │   ├── styles/         # スタイル定義
│   │   │   ├── utils/          # ユーティリティ関数
│   │   │   └── App.tsx         # アプリケーションエントリ
│   │   ├── public/             # 静的ファイル
│   │   ├── tests/              # client のテスト
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                 # バックエンド
│   │   ├── src/
│   │   │   ├── routes/         # API ルート定義
│   │   │   ├── controllers/    # コントローラー
│   │   │   ├── services/       # ビジネスロジック
│   │   │   ├── models/         # データモデル
│   │   │   ├── middleware/     # ミドルウェア
│   │   │   └── index.ts        # サーバーエントリ
│   │   ├── tests/              # server のテスト
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                 # フロントエンド・バックエンド共通
│       ├── src/
│       │   ├── types/          # 型定義
│       │   └── constants/      # 定数
│       ├── tests/              # shared のテスト
│       ├── package.json
│       └── tsconfig.json
│
├── storage/                    # 画像ストレージ（ローカル）
│   ├── originals/              # オリジナル画像
│   └── thumbnails/             # サムネイル画像
│
├── scripts/                    # ビルド・管理スクリプト
│
├── docs/                       # ドキュメント
│
├── .env.example                # 環境変数テンプレート
├── package.json                # ルート npm 設定（ワークスペース）
├── README.md                   # プロジェクト README
└── LICENSE                     # ライセンスファイル
```

## 主要ディレクトリの説明

### `packages/client/`
フロントエンドのパッケージ。コンポーネントベースの設計で、再利用可能な UI 部品を `components/` に、ページ単位のコンポーネントを `pages/` に配置。

### `packages/server/`
バックエンドのパッケージ。MVC パターンに基づき、ルーティング、コントローラー、サービス層を分離。

### `packages/shared/`
フロントエンドとバックエンドで共有する型定義や定数。API のレスポンス型などを一元管理。

### `storage/`
アップロードされた画像の保存先。オリジナル画像とサムネイルを分離して管理。

## テスト構成

各パッケージ内に `tests/` ディレクトリを配置し、ユニットテストと統合テストをパッケージ毎に管理。
