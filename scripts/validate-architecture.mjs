#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import process from 'node:process';

const root = resolve('src/app');
const violations = [];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return nested.flat();
};

const normalized = (path) => relative(root, path).split(sep).join('/');
const importsOf = (source) =>
  [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);

for (const file of (await walk(root)).filter((path) => extname(path) === '.ts')) {
  const path = normalized(file);
  const source = await readFile(file, 'utf8');
  const imports = importsOf(source);

  if (
    source.includes('HttpClient') &&
    !path.includes('/infrastructure/') &&
    !path.startsWith('core/http/')
  ) {
    violations.push(`${path}: HttpClient só pode existir em infrastructure ou core/http.`);
  }
  if (/\b(localStorage|sessionStorage)\b/.test(source)) {
    violations.push(`${path}: sessão persistente no navegador exige decisão arquitetural.`);
  }
  if (
    path.includes('/presentation/') &&
    imports.some((value) => value.includes('/infrastructure/'))
  ) {
    violations.push(`${path}: presentation não pode importar infrastructure.`);
  }
  if (
    path.includes('/application/') &&
    imports.some((value) => /\/(presentation|infrastructure)\//.test(value))
  ) {
    violations.push(`${path}: application não pode importar presentation ou infrastructure.`);
  }
  if (path.includes('/application/') && imports.some((value) => value.startsWith('@angular/'))) {
    violations.push(`${path}: application deve permanecer independente do Angular.`);
  }
  if (
    /\/(application|presentation)\//.test(path) &&
    imports.some((value) => /(?:^|\/)(?:dto|dtos)(?:\/|$)|\.dto$/.test(value))
  ) {
    violations.push(`${path}: DTO externo deve permanecer em infrastructure.`);
  }
  if (
    path.includes('/infrastructure/') &&
    imports.some((value) => value.includes('/presentation/'))
  ) {
    violations.push(`${path}: infrastructure não pode importar presentation.`);
  }

  const currentFeature = path.match(/^features\/([^/]+)\//)?.[1];
  for (const imported of imports) {
    const targetFeature = imported.match(/features\/([^/]+)\//)?.[1];
    if (
      currentFeature &&
      targetFeature &&
      currentFeature !== targetFeature &&
      !imported.endsWith('/public-api')
    ) {
      violations.push(`${path}: use o public-api para acessar a feature ${targetFeature}.`);
    }
  }
}

if (violations.length > 0) {
  console.error(['Violações arquiteturais:', ...violations.map((item) => `- ${item}`)].join('\n'));
  process.exitCode = 1;
} else {
  process.stdout.write('Guardrails arquiteturais aprovados.\n');
}
