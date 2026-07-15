#!/usr/bin/env node

import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const platformDirectory = resolve(
  process.env['OFICINA_PLATFORM_DIR'] ?? '../oficina-platform',
  'contracts/openapi',
);
const targetDirectory = resolve('contracts/openapi');
const contracts = [
  'oficina-auth-lambda.yaml',
  'oficina-os-service.yaml',
  'oficina-execution-service.yaml',
];

await mkdir(targetDirectory, { recursive: true });
for (const contract of contracts) {
  await copyFile(resolve(platformDirectory, contract), resolve(targetDirectory, contract));
}

process.stdout.write(`Contratos sincronizados de ${platformDirectory}.\n`);
