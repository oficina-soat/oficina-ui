import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const buildRoot = join(root, 'dist', 'oficina-ui', 'browser');
const angularConfig = JSON.parse(await readFile(join(root, 'angular.json'), 'utf8'));
const production =
  angularConfig.projects?.['oficina-ui']?.architect?.build?.configurations?.production;
const violations = [];

if (production?.sourceMap !== false) {
  violations.push(
    'angular.json deve desabilitar sourceMap explicitamente na configuração production.',
  );
}
if (production?.namedChunks !== false) {
  violations.push(
    'angular.json deve desabilitar namedChunks explicitamente na configuração production.',
  );
}

const files = [];
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
};
await walk(buildRoot);

const forbiddenExtensions = new Set(['.map', '.pem', '.key', '.p12', '.pfx']);
const sensitivePatterns = [
  ['chave privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['access key AWS', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['token GitHub', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/],
  ['JWT literal', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ['Authorization Bearer literal', /Authorization["']?\s*[:=]\s*["']Bearer\s+[A-Za-z0-9._-]{12,}/i],
  ['source map referenciado', /[#@]\s*sourceMappingURL=/],
];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.txt']);

for (const file of files) {
  const path = relative(buildRoot, file);
  const extension = extname(file);
  if (forbiddenExtensions.has(extension)) {
    violations.push(`artefato proibido no build: ${path}`);
  }
  if (!textExtensions.has(extension)) continue;
  const content = await readFile(file, 'utf8');
  for (const [label, pattern] of sensitivePatterns) {
    if (pattern.test(content)) violations.push(`${label} encontrado em ${path}`);
  }
}

const runtimePath = join(buildRoot, 'config', 'runtime-config.json');
const runtime = JSON.parse(await readFile(runtimePath, 'utf8'));
const runtimeKeys = Object.keys(runtime).sort();
if (runtimeKeys.join(',') !== 'apiBaseUrl,authBaseUrl') {
  violations.push('runtime-config.json deve conter somente apiBaseUrl e authBaseUrl.');
}

if (violations.length > 0) {
  console.error(
    ['Violações de segurança do build:', ...violations.map((item) => `- ${item}`)].join('\n'),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Build de produção aprovado: ${files.length} artefatos sem source maps ou segredos detectáveis.`,
  );
}
