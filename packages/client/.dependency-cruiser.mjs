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

    // features 間の直接依存を禁止（shared 経由のみ）
    {
      name: 'no-cross-feature-deps',
      severity: 'error',
      comment: 'features/ 間の直接依存は禁止（shared/ 経由で共有する）',
      from: {
        path: '^src/features/([^/]+)/',
      },
      to: {
        path: '^src/features/([^/]+)/',
        pathNot: '^src/features/$1/',
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
        path: '^src/(features|api|routes)/',
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
