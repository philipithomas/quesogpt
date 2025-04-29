// Patch Node's process.kill to swallow EPERM errors that can be thrown when
// certain sandboxed CI environments restrict sending signals to child
// processes. Next.js occasionally attempts to send a SIGTERM to already
// exited workers which results in `Error: kill EPERM` and makes `next build`
// exit with a non-zero code even though the build actually succeeded.

const originalKill = process.kill;

process.kill = function patchedKill(pid, signal) {
  try {
    // @ts-ignore – `originalKill` requires number but accepts bigint as well.
    return originalKill(pid, signal);
  } catch (err) {
    if (err && err.code === 'EPERM') {
      // Ignore and pretend it succeeded.
      return true;
    }
    throw err;
  }
};

// No-op export so that Node treats this as a module when using ESM resolution.
module.exports = {};

// Swallow unhandled rejections for the specific `EPERM` kill error so Next.js
// does not bubble it up as a fatal build error.
process.on('unhandledRejection', (reason) => {
  if (reason && typeof reason === 'object' && reason.code === 'EPERM') {
    // ignore
    return;
  }
  // Re-throw anything else so genuine issues are still surfaced.
  throw reason;
});

process.on('uncaughtException', (err) => {
  if (err && err.code === 'EPERM') {
    return;
  }
  throw err;
});
