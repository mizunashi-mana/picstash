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
        path: '^src/(app|features)/',
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
