#!/usr/bin/env node
// Ensure a production build exists before starting Next.js.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

function run(command, args) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });
}

if (!fs.existsSync(buildIdPath)) {
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
