#!/usr/bin/env node
// Ensure a production build exists before starting Next.js.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cwd = process.cwd();
const buildIdPath = path.join(cwd, '.next', 'BUILD_ID');
const sourceDirs = [
  path.join(cwd, 'app'),
  path.join(cwd, 'pages'),
  path.join(cwd, 'src', 'app'),
  path.join(cwd, 'src', 'pages'),
];

function run(command, args) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });
}

if (!fs.existsSync(buildIdPath)) {
  const hasSource = sourceDirs.some((dir) => fs.existsSync(dir));

  if (!hasSource) {
    console.error(
      'No production build found at .next/BUILD_ID and no source directory detected.\n' +
      'Rebuild the Docker image or run `npm run build` in an environment with the source code before starting.',
    );
    process.exit(1);
  }

  const npmExec = process.env.npm_execpath || 'npm';
  console.warn('No production build detected. Running `npm run build`...');
  const buildResult = run(npmExec, ['run', 'build']);
  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }
}

const nextBin = require.resolve('next/dist/bin/next');
const startResult = run(process.execPath, [nextBin, 'start']);

process.exit(startResult.status ?? 1);
