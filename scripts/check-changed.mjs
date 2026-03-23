import { execFileSync } from 'node:child_process';

function getChangedFiles() {
  const output = execFileSync('git', ['status', '--porcelain'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z?]+\s+/, ''))
    .filter((file) => !file.startsWith('dist/'));
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  console.log('No changed files detected.');
  process.exit(0);
}

const lintTargets = changedFiles.filter((file) => /\.(js|mjs|cjs|ts|tsx)$/.test(file));
const testTargets = changedFiles.filter((file) => /^src\/.*\.(ts|tsx)$/.test(file));

if (lintTargets.length > 0) {
  run('npx', ['eslint', ...lintTargets]);
}

run('npm', ['run', 'typecheck']);

if (testTargets.length > 0) {
  run('npx', ['vitest', 'related', '--run', ...testTargets]);
}
