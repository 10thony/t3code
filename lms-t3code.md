---
## Windows setup plan (T3 Code + Spark models + LM Studio prep)

### Goal

- Run **T3 Code** dev stack **on Windows** (browser + server + web).
- Use **SSH** only to reach **inference on Spark** (e.g. LM Studio / `lms server` on `cobec-spark`).
- Install and verify **LM Studio + `lms`** on Windows so you can develop/test LM Studio integration locally; mirror the same server pattern on Spark when you want GPU there.
---

### 1) Base tooling

1. Install **Git for Windows** and use **PowerShell** or **Windows Terminal**.
2. Install **Bun** matching the repo: **≥ 1.3.9** (see root `package.json` `engines.bun`).
3. Install **Node.js** matching the repo: **≥ 24.13.1** (root `engines.node`).
   - **Important:** Root script `bun dev` runs `node scripts/dev-runner.ts`; **Node 20 will fail** on `.ts` ESM. Use **Node 24+** on Windows.
4. Optional but useful: **fnm** or **nvm-windows** to pin Node 24 for this repo.

**Verify:**

```powershell
bun --version
node --version
```

---

### 2) Codex (product requirement)

Per [README](https://github.com/pingdotgg/t3code/blob/main/README.md), T3 Code expects **[Codex CLI](https://github.com/openai/codex)** installed and authorized. Install and log in on Windows so sessions work end-to-end.

---

### 3) Clone and install dependencies

```powershell
cd <your-projects-dir>
git clone <your-fork-or-upstream-url> t3code
cd t3code
bun install
```

---

### 4) Quality gate (must pass before “done”)

From repo root:

```powershell
bun fmt
bun lint
bun typecheck
```

Use `bun run test` for Vitest (not `bun test`), per `AGENTS.md`.

---

### 5) Run full dev on Windows

From repo root:

```powershell
$env:T3CODE_NO_BROWSER = "1"   # optional: stop auto-opening browser
bun dev
```

Default dev ports (from `scripts/dev-runner.ts`): **server 3773**, **web 5733**. Open `http://localhost:5733` (or whatever the dev-runner log prints if ports shift).

If `bun dev` still fails, capture **exact Node version** and error; fallback is running `apps/server` and `apps/web` manually with Bun (only if needed).

---

### 6) LM Studio + `lms` on Windows (prep for integration)

Per [LM Studio CLI docs](https://lmstudio.ai/docs/cli):

1. Install **LM Studio** from the official site and **open it at least once** (required before `lms` works).
2. In a terminal:

   ```powershell
   lms --help
   ```

3. Learn the **local server** workflow you will eventually point T3 at:

   ```powershell
   lms server start
   lms server status
   lms server stop
   ```

4. Note the **host/port** and **API shape** (OpenAI-compatible vs custom) LM Studio exposes when serving; that will drive T3 integration (config/env, provider wiring in `apps/server`).

5. Optional for automation: `lms load`, `lms ps`, `lms ls` as documented on the same CLI index.

**Deliverable for the agent:** a short note in the task output: LM Studio version, `lms --version`, and the **exact base URL** (e.g. `http://127.0.0.1:<port>/v1`) the server prints when started.

---

### 7) Spark: models only (hybrid)

1. On **Spark**, run your inference stack (LM Studio GUI, or `lms server start` headless if you use the [daemon](https://lmstudio.ai/docs/cli) path—see LM Studio docs for `lms daemon` / server).
2. On **Windows**, create a **persistent SSH tunnel** from Spark’s inference HTTP port to localhost, e.g.:

   ```powershell
   ssh -L <localPort>:127.0.0.1:<sparkLmStudioPort> <user>@cobec-spark
   ```

3. Point **future** T3 LM Studio integration at `http://127.0.0.1:<localPort>` (same pattern as any OpenAI-compatible endpoint).

**Security:** do not expose model servers to the internet without auth; prefer localhost + SSH or Tailscale.

---

### 8) Acceptance checklist (for the Windows agent)

- [ ] `bun --version` and `node --version` meet `engines` in root `package.json`.
- [ ] `bun install` completes cleanly.
- [ ] `bun fmt`, `bun lint`, `bun typecheck` all succeed.
- [ ] `bun dev` runs; UI loads at the printed web URL.
- [ ] Codex CLI installed and authorized.
- [ ] LM Studio installed; `lms --help` works; `lms server start` documented with actual URL/port.
- [ ] (If using Spark) SSH tunnel tested: `curl` or browser to forwarded localhost reaches the model server.

---

### 9) What _not_ to do yet (unless you start coding the feature)

- Do not assume env var names for “LM Studio” in T3 until you inspect how providers are configured in `apps/server` and `packages/contracts`.
- Integration work should be a **separate, small PR**: config surface + server-side client + UI model picker, following existing Codex/Claude patterns.

---
