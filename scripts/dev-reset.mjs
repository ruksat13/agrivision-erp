#!/usr/bin/env node
/**
 * One command to get a working local database:
 *
 *     npm run dev:reset
 *
 * Starts the Firestore and Auth emulators, waits for them, loads the
 * development security rules, wipes anything already there and seeds 240
 * documents. Then it stays in the foreground with the emulator, so Ctrl-C
 * stops everything together.
 *
 * The emulator keeps nothing on disk, so this has to be re-run after every
 * machine restart. That is the whole reason this script exists — it turns four
 * steps that are easy to get out of order into one that is not.
 *
 * Then, in a second terminal:
 *
 *     npm run start:emulator
 *
 * Flags:
 *   --no-seed    start the emulators and load dev rules, but leave it empty
 *   --keep       do not wipe first (seeding will refuse if data is present)
 */

import { spawn } from 'child_process';

const args = process.argv.slice(2);
const NO_SEED = args.includes('--no-seed');
const KEEP = args.includes('--keep');

const HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;      // matches firebase.json
const READY_TIMEOUT_MS = 90_000;

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const say = (msg) => console.log(`\x1b[36m[dev:reset]\x1b[0m ${msg}`);
const bad = (msg) => console.error(`\x1b[31m[dev:reset]\x1b[0m ${msg}`);

// ── Start the emulators ───────────────────────────────────────────────────

say('starting Firestore and Auth emulators…');

const emulator = spawn(
    npx,
    ['firebase', 'emulators:start', '--only', 'firestore,auth', '--project', 'agrivision-erp'],
    { stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32' },
);

let shuttingDown = false;

const stop = (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (!emulator.killed) emulator.kill('SIGINT');
    // Give the emulator a moment to release its ports before we exit.
    setTimeout(() => process.exit(code), 800);
};

process.on('SIGINT', () => { say('shutting down…'); stop(0); });
process.on('SIGTERM', () => stop(0));

emulator.on('exit', (code) => {
    if (!shuttingDown) {
        bad(`the emulator exited early (code ${code}).`);
        bad('Is another emulator already running, or is port 8080 taken?');
        process.exit(code ?? 1);
    }
});

// ── Wait for it to accept connections ─────────────────────────────────────

async function waitForFirestore() {
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
        try {
            await fetch(`http://${HOST}:${FIRESTORE_PORT}/`);
            return true;
        } catch {
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return false;
}

// ── Run a child script and resolve on success ─────────────────────────────

function run(scriptArgs, label) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, scriptArgs, { stdio: 'inherit' });
        child.on('exit', (code) => (code === 0
            ? resolve()
            : reject(new Error(`${label} failed (exit ${code})`))));
    });
}

// ── Sequence ──────────────────────────────────────────────────────────────

(async () => {
    if (!await waitForFirestore()) {
        bad(`the emulator did not come up within ${READY_TIMEOUT_MS / 1000}s.`);
        return stop(1);
    }
    say('emulators are up.');

    try {
        // firebase.json points the emulator at firestore.rules, which are the
        // production rules — they deny everything until Firebase Auth is
        // connected and users/ is seeded, the seed script included. Swap in the
        // development rules over the emulator's admin API instead, so
        // firestore.rules itself is never edited.
        await run(['scripts/emulator-rules.mjs', 'dev'], 'loading dev rules');

        if (!NO_SEED) {
            const seedArgs = ['scripts/seed.mjs', '--emulator'];
            if (!KEEP) seedArgs.push('--wipe');
            await run(seedArgs, 'seeding');
            await run(['scripts/verify.mjs', '--emulator'], 'verification');
        }
    } catch (err) {
        bad(err.message);
        return stop(1);
    }

    console.log(`
\x1b[32m────────────────────────────────────────────────────────────\x1b[0m
  Local database ready.

  Emulator UI    http://127.0.0.1:4000
  Firestore      ${HOST}:${FIRESTORE_PORT}
  Auth           ${HOST}:9099

  Next, in another terminal:   \x1b[1mnpm run start:emulator\x1b[0m

  Leave this window open — Ctrl-C stops the emulator and
  discards the data. Re-run \x1b[1mnpm run dev:reset\x1b[0m to get it back.
\x1b[32m────────────────────────────────────────────────────────────\x1b[0m
`);
})();
