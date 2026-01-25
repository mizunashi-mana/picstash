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

    // domain レイヤーは他のレイヤーに依存しない
    {
      name: 'domain-no-deps',
      severity: 'error',
      comment: 'domain/ は他のレイヤーに依存してはいけない',
      from: {
        path: '^src/domain/',
      },
      to: {
        path: '^src/(application|infra)/',
      },
    },

    // application レイヤーは domain のみに依存可能 (infra への依存を禁止)
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'application/ は infra/ に依存してはいけない',
      from: {
        path: '^src/application/',
      },
      to: {
        path: '^src/infra/',
      },
    },

    // shared は他のレイヤーに依存しない
    {
      name: 'shared-no-deps',
      severity: 'error',
      comment: 'shared/ は他のレイヤーに依存してはいけない',
      from: {
        path: '^src/shared/',
      },
      to: {
        path: '^src/(domain|application|infra)/',
      },
    },

    // エントリポイントから到達できないモジュールを検出
    {
      name: 'not-reachable-from-entry',
      severity: 'error',
      comment:
        'エントリポイントから到達できないモジュールはデッドコードの可能性がある',
      from: {
        path: '^src/index\\.ts$',
      },
      to: {
        path: '^src/',
        pathNot: [
          '\\.test\\.tsx?$',
          '__tests__/',
          '__mocks__/',
          '^src/cli/',
          // CLI からのみ使用されるモジュール
          '^src/application/attribute-suggestion/generate-label-embeddings\\.ts$',
        ],
        reachable: false,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: 'generated/',
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
