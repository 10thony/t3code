#!/usr/bin/env node
/**
 * Starts the desktop dev stack with Electron main-process inspect and a renderer
 * remote-debug port. Use with `.vscode/launch.json` attach configurations.
 *
 * Defaults: main `--inspect=9230`, `--remote-debugging-port=9222`.
 * Pass `--brk` to use `--inspect-brk=9230` instead (attach debugger before resume).
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const useBrk = process.argv.includes("--brk");

if (useBrk) {
  delete process.env.T3CODE_ELECTRON_INSPECT;
  process.env.T3CODE_ELECTRON_INSPECT_BRK ??= "9230";
} else {
  delete process.env.T3CODE_ELECTRON_INSPECT_BRK;
  process.env.T3CODE_ELECTRON_INSPECT ??= "9230";
}
process.env.T3CODE_ELECTRON_REMOTE_DEBUG ??= "9222";

const child = spawn("bun", ["scripts/dev-runner.ts", "dev:desktop"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
