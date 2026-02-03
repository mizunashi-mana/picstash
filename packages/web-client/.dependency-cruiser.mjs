/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
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

    // features 間の内部実装への直接依存を禁止（index.ts 経由のみ許可）
    {
      name: 'no-cross-feature-deps',
      severity: 'error',
      comment:
        'features/ 間の内部実装への直接依存は禁止（index.ts 経由で公開 API を利用する）',
      from: {
        path: '^src/features/([^/]+)/',
      },
      to: {
        path: '^src/features/([^/]+)/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'],
      },
    },

    // shared は他のディレクトリに依存しない
    {
      name: 'shared-no-deps',
      severity: 'error',
      comment: 'shared/ は他のディレクトリに依存してはいけない',
      from: {
        path: '^src/shared/',
      },
      to: {
        path: '^src/(app|entities|features|widgets|pages)/',
      },
    },

    // entities は shared のみに依存可能
    {
      name: 'entities-no-upper-deps',
      severity: 'error',
      comment: 'entities/ は features/, widgets/, pages/, app/ に依存してはいけない',
      from: {
        path: '^src/entities/',
      },
      to: {
        path: '^src/(app|features|widgets|pages)/',
      },
    },

    // features は shared, entities のみに依存可能（widgets, pages, app は不可）
    // ただし widgets/job-status の useJobs は features から利用可能（FSD の緩和ルール）
    {
      name: 'features-no-upper-deps',
      severity: 'error',
      comment: 'features/ は widgets/, pages/, app/ に依存してはいけない（widgets の公開 API は例外）',
      from: {
        path: '^src/features/',
      },
      to: {
        path: '^src/(app|widgets|pages)/',
        pathNot: ['^src/widgets/[^/]+/index\\.ts$'],
      },
    },

    // widgets は shared, entities, features のみに依存可能（pages, app は不可）
    {
      name: 'widgets-no-upper-deps',
      severity: 'error',
      comment: 'widgets/ は pages/ や app/ に依存してはいけない',
      from: {
        path: '^src/widgets/',
      },
      to: {
        path: '^src/(app|pages)/',
      },
    },

    // pages は shared, entities, features, widgets のみに依存可能（app は不可）
    {
      name: 'pages-no-upper-deps',
      severity: 'error',
      comment: 'pages/ は app/ に依存してはいけない',
      from: {
        path: '^src/pages/',
      },
      to: {
        path: '^src/app/',
      },
    },

    // pages 間の内部実装への直接依存を禁止（index.ts 経由のみ許可）
    {
      name: 'no-cross-page-deps',
      severity: 'error',
      comment:
        'pages/ 間の内部実装への直接依存は禁止（index.ts 経由で公開 API を利用する）',
      from: {
        path: '^src/pages/([^/]+)/',
      },
      to: {
        path: '^src/pages/([^/]+)/',
        pathNot: ['^src/pages/$1/', '^src/pages/[^/]+/index\\.ts$'],
      },
    },

    // widgets 間の内部実装への直接依存を禁止（index.ts 経由のみ許可）
    {
      name: 'no-cross-widget-deps',
      severity: 'error',
      comment:
        'widgets/ 間の内部実装への直接依存は禁止（index.ts 経由で公開 API を利用する）',
      from: {
        path: '^src/widgets/([^/]+)/',
      },
      to: {
        path: '^src/widgets/([^/]+)/',
        pathNot: ['^src/widgets/$1/', '^src/widgets/[^/]+/index\\.ts$'],
      },
    },

    // entities 間の内部実装への直接依存を禁止（index.ts 経由のみ許可）
    {
      name: 'no-cross-entity-deps',
      severity: 'error',
      comment:
        'entities/ 間の内部実装への直接依存は禁止（index.ts 経由で公開 API を利用する）',
      from: {
        path: '^src/entities/([^/]+)/',
      },
      to: {
        path: '^src/entities/([^/]+)/',
        pathNot: ['^src/entities/$1/', '^src/entities/[^/]+/index\\.ts$'],
      },
    },

    // main.tsx から到達できないモジュールを検出
    {
      name: 'not-reachable-from-main',
      severity: 'error',
      comment:
        'main.tsx から到達できないモジュールはデッドコードの可能性がある',
      from: {
        path: '^src/app/main\\.tsx$',
      },
      to: {
        path: '^src/',
        pathNot: [
          '\\.test\\.tsx?$',
          '\\.stories\\.tsx$',
          '__tests__/',
          '__mocks__/',
          'vite-env\\.d\\.ts$',
        ],
        reachable: false,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json',
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
