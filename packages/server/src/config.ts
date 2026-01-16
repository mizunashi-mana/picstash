import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { z } from 'zod';

const currentDir = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(currentDir, '../config.yaml');

const configSchema = z.object({
  server: z.object({
    port: z.number().int().positive().default(3000),
    host: z.string().default('0.0.0.0'),
  }),
  database: z.object({
    url: z.string().min(1, 'Database URL is required'),
  }),
  storage: z.object({
    path: z.string().min(1, 'Storage path is required'),
  }),
});

export type Config = z.infer<typeof configSchema>;

const configFile = readFileSync(configPath, 'utf8');
const rawConfig = yaml.load(configFile);
export const config = configSchema.parse(rawConfig);
