import { readFile } from 'node:fs/promises';
import * as swc from '@swc/core';
import * as esbuild from 'esbuild';

/**
 * SWC プラグイン
 * デコレータとメタデータの emit をサポートするために使用
 */
const swcPlugin: esbuild.Plugin = {
  name: 'swc',
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      const source = await readFile(args.path, 'utf-8');
      const result = await swc.transform(source, {
        filename: args.path,
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
        },
      });
      return {
        contents: result.code,
        loader: 'js',
      };
    });
  },
};

/**
 * Native modules や ESM 互換性のないパッケージを external 化
 *
 * これらのパッケージはバンドルせず、node_modules から直接読み込む
 */
const externalPackages = [
  // Electron
  'electron',

  // Native modules (ネイティブバイナリを含む)
  'better-sqlite3',
  'sharp',
  'sqlite-vec',
  'node-unrar-js',
  '@node-rs/*',

  // Prisma (CommonJS runtime が ESM バンドルと互換性がない)
  '@prisma/client',
  '@prisma/adapter-better-sqlite3',

  // Generated Prisma client (ローカル生成) - エイリアスで解決されるので external 指定不要

  // Heavy ML libraries (サイズが大きく、動的インポートを使用)
  '@huggingface/transformers',
  'tesseract.js',

  // Archive libraries (optional dependencies を持つ)
  'unzipper',
  'yauzl-promise',
  '@aws-sdk/*',
];

/**
 * Main process のビルド設定
 */
export const mainConfig: esbuild.BuildOptions = {
  entryPoints: ['src/main/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/main/index.js',
  external: externalPackages,
  alias: {
    '@desktop-app/main': './src/main',
    '@desktop-app/shared': './src/shared',
    '@~generated': './generated',
  },
  plugins: [swcPlugin],
};

/**
 * Preload script のビルド設定
 */
export const preloadConfig: esbuild.BuildOptions = {
  entryPoints: ['src/preload/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/preload/index.mjs',
  external: ['electron'],
  alias: {
    '@desktop-app/shared': './src/shared',
  },
};

/**
 * ビルドを実行
 */
async function build(target: string): Promise<void> {
  switch (target) {
    case 'main':
      await esbuild.build(mainConfig);
      break;
    case 'preload':
      await esbuild.build(preloadConfig);
      break;
    case 'all':
      await Promise.all([
        esbuild.build(mainConfig),
        esbuild.build(preloadConfig),
      ]);
      break;
    default:
      throw new Error('Usage: npx tsx esbuild.config.ts [main|preload|all]');
  }
}

// CLI から実行された場合
const target = process.argv[2] ?? '';
await build(target);
