import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '../config.yaml');

const configSchema = z.object({
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
