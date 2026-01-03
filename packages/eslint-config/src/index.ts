import { defineConfig } from 'eslint/config';
import { buildCommentsConfig } from './comments.config.js';
import { buildGlobalsConfig } from './globals.config.js';
import { buildImportsConfig } from './imports.config.js';
import { buildJsConfig } from './js.config.js';
import { buildNodeConfig } from './node.config.js';
import { buildPromiseConfig } from './promise.config.js';
import { buildReactConfig } from './react.config.js';
import { buildStylisticConfig } from './stylistic.config.js';
import { buildTsConfig } from './ts.config.js';

export type RuleSet = 'common' | 'react';

export type Env = {
  disableFixedRules?: boolean;
  ruleSets?: RuleSet[];
};

export function buildConfig(env: Env) {
  const ruleSets = env.ruleSets ?? ['common'];
  const disableFixedRules = env.disableFixedRules ?? process.env.DISABLED_FIXED_RULES === 'true';

  const rules: Parameters<typeof defineConfig>[0] = [
    buildGlobalsConfig(),
  ];

  for (const ruleSet of ruleSets) {
    switch (ruleSet) {
      case 'common':
        rules.push(
          buildJsConfig(),
          buildTsConfig(),
          buildStylisticConfig(),
          buildImportsConfig({ disableFixedRules }),
          buildPromiseConfig(),
          buildNodeConfig(),
          buildCommentsConfig(),
        );
        break;
      case 'react':
        rules.push(buildReactConfig());
        break;
    }
  }

  return defineConfig(rules);
}
