/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    // ============================================
    // 共通ルール
    // ============================================

    // 循環依存を禁止
    {
      name: 'no-circular',
      severity: 'error',
      comment: '循環依存は複雑性を高めるため禁止',
      from: {},
      to: {
        circular: true,
      },
    },

    // ============================================
    // Renderer (Feature-Sliced Design)
    // ============================================

    // features 間の内部実装への直接依存を禁止（index.ts 経由のみ許可）
    {
      name: 'renderer-no-cross-feature-deps',
      severity: 'error',
      comment:
        'renderer/features/ 間の内部実装への直接依存は禁止（index.ts 経由で公開 API を利用する）',
      from: {
        path: '^src/renderer/features/([^/]+)/',
      },
      to: {
        path: '^src/renderer/features/([^/]+)/',
        pathNot: [
          '^src/renderer/features/$1/',
          '^src/renderer/features/[^/]+/index\\.ts$',
        ],
      },
    },

    // renderer/shared は他の renderer ディレクトリに依存しない
    {
      name: 'renderer-shared-no-deps',
      severity: 'error',
      comment: 'renderer/shared/ は他の renderer ディレクトリに依存してはいけない',
      from: {
        path: '^src/renderer/shared/',
      },
      to: {
        path: '^src/renderer/(features|api|routes)/',
      },
    },

    // renderer/api は features, routes に依存しない
    {
      name: 'renderer-api-no-deps',
      severity: 'error',
      comment: 'renderer/api/ は features, routes に依存してはいけない',
      from: {
        path: '^src/renderer/api/',
      },
      to: {
        path: '^src/renderer/(features|routes)/',
      },
    },

    // main.tsx から到達できない renderer モジュールを検出
    {
      name: 'renderer-not-reachable-from-main',
      severity: 'error',
      comment:
        'renderer/main.tsx から到達できないモジュールはデッドコードの可能性がある',
      from: {
        path: '^src/renderer/main\\.tsx$',
      },
      to: {
        path: '^src/renderer/',
        pathNot: [
          '\\.test\\.tsx?$',
          '\\.stories\\.tsx$',
          '__tests__/',
          '__mocks__/',
          'vite-env\\.d\\.ts$',
          // barrel exports は公開 API として許可（内部では直接パスを使用）
          '/index\\.ts$',
        ],
        reachable: false,
      },
    },

    // ============================================
    // Main Process (Clean Architecture)
    // ============================================

    // main/domain レイヤーは他のレイヤーに依存しない
    {
      name: 'main-domain-no-deps',
      severity: 'error',
      comment: 'main/domain/ は他のレイヤーに依存してはいけない',
      from: {
        path: '^src/main/domain/',
      },
      to: {
        path: '^src/main/(application|infra)/',
      },
    },

    // main/application レイヤーは domain のみに依存可能（infra への依存を禁止）
    {
      name: 'main-application-no-infra',
      severity: 'error',
      comment: 'main/application/ は main/infra/ に依存してはいけない',
      from: {
        path: '^src/main/application/',
      },
      to: {
        path: '^src/main/infra/',
      },
    },

    // ============================================
    // プロセス間の境界
    // ============================================

    // renderer は main に直接依存しない（preload 経由のみ）
    {
      name: 'renderer-no-main-deps',
      severity: 'error',
      comment: 'renderer/ は main/ に直接依存してはいけない（preload 経由で通信する）',
      from: {
        path: '^src/renderer/',
      },
      to: {
        path: '^src/main/',
      },
    },

    // main は renderer に依存しない
    {
      name: 'main-no-renderer-deps',
      severity: 'error',
      comment: 'main/ は renderer/ に依存してはいけない',
      from: {
        path: '^src/main/',
      },
      to: {
        path: '^src/renderer/',
      },
    },

    // preload は renderer に依存しない
    {
      name: 'preload-no-renderer-deps',
      severity: 'error',
      comment: 'preload/ は renderer/ に依存してはいけない',
      from: {
        path: '^src/preload/',
      },
      to: {
        path: '^src/renderer/',
      },
    },

    // preload は main に依存しない（IPC 経由で通信するため）
    {
      name: 'preload-no-main-deps',
      severity: 'error',
      comment: 'preload/ は main/ に依存してはいけない（IPC 経由で通信する）',
      from: {
        path: '^src/preload/',
      },
      to: {
        path: '^src/main/',
      },
    },

    // src/shared は各プロセス固有のコードに依存しない
    {
      name: 'shared-no-process-deps',
      severity: 'error',
      comment: 'src/shared/ は main, renderer, preload に依存してはいけない',
      from: {
        path: '^src/shared/',
      },
      to: {
        path: '^src/(main|renderer|preload)/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.renderer.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
