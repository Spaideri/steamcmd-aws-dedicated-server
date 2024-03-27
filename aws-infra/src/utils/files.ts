import fs from 'fs';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';
import { Configuration } from '../types';

export function parseConfiguration(): Configuration {
  const configurationFile = fs.readFileSync('../config.yaml', 'utf8');
  return YAML.parse(configurationFile) as Configuration;
}

export const getPath = (path: string, base: string): string => {
  return fileURLToPath(new URL(path, base));
};
