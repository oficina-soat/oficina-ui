#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const contracts = [
  ['oficina-auth-lambda.yaml', 'src/app/features/auth/infrastructure/generated'],
  ['oficina-os-service.yaml', 'src/app/features/attendance/infrastructure/generated'],
  ['oficina-execution-service.yaml', 'src/app/features/execution/infrastructure/generated'],
];
const executable = resolve('node_modules/@hey-api/openapi-ts/bin/run.js');

for (const [input, output] of contracts) {
  await rm(resolve(output), { force: true, recursive: true });
  const result = spawnSync(
    process.execPath,
    [
      executable,
      '-i',
      resolve('contracts/openapi', input),
      '-o',
      resolve(output),
      '-p',
      '@hey-api/typescript',
    ],
    { encoding: 'utf8', stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
