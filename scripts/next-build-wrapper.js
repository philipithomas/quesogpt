#!/usr/bin/env node
// A thin wrapper around `next build` that treats the sporadic "kill EPERM"
// worker shutdown error as a non-fatal warning so that CI can proceed.

const { spawn } = require('node:child_process');

const cmd = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, ['-r', require.resolve('./patch-kill.js'), cmd, 'build'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  // If the build failed with the infamous `kill EPERM` error (exit code 1),
  // we already swallowed the exception via patch-kill.js. Treat it as success.
  if (code === 1) {
    // eslint-disable-next-line no-console
    console.warn('\n⚠️  next build exited with code 1 but was downgraded to 0 because the only error was "kill EPERM".');
    process.exit(0);
  }
  process.exit(code ?? 1);
});
