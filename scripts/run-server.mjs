import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const serverRoot = path.join(workspaceRoot, 'server');
const tsxCli = path.join(serverRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const localNode = path.join(
  workspaceRoot,
  '.runtime',
  'node-v24.19.0-win-x64',
  'node.exe',
);
const currentMajor = Number(process.versions.node.split('.')[0]);

let serverNode;
if (process.platform === 'win32' && existsSync(localNode)) {
  serverNode = localNode;
} else if (currentMajor === 24) {
  serverNode = process.execPath;
} else {
  console.error(
    `[Runtime] The serial server requires Node 24 LTS; current runtime is ${process.version}.`,
  );
  console.error('[Runtime] Install/use Node 24.19.0 (see .nvmrc) and run the command again.');
  process.exit(1);
}

console.log(`[Runtime] Starting serial server with ${serverNode}`);

const child = spawn(serverNode, [tsxCli, 'watch', 'src/index.ts'], {
  cwd: serverRoot,
  stdio: 'inherit',
  windowsHide: true,
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.once('SIGINT', () => forwardSignal('SIGINT'));
process.once('SIGTERM', () => forwardSignal('SIGTERM'));

child.once('error', (error) => {
  console.error('[Runtime] Failed to start Node 24 serial server:', error);
  process.exitCode = 1;
});

child.once('exit', (code, signal) => {
  if (signal) {
    console.log(`[Runtime] Serial server stopped by ${signal}.`);
  }
  process.exitCode = code ?? (signal ? 1 : 0);
});
