#!/usr/bin/env node
/**
 * One command to get a working local database:
 *
 *     npm run dev:reset
 *
 * Starts the Firestore and Auth emulators, waits for BOTH of them, loads the
 * development security rules, wipes anything already there, seeds 285
 * documents and creates the twelve logins. Then it stays in the foreground with
 * the emulator, so Ctrl-C stops everything together.
 *
 * Nothing here is optional and nothing is best-effort: if any step fails the
 * emulator is stopped and the command exits non-zero, because a half-seeded
 * database that cannot be logged into is worse than no database at all.
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
 *   --no-seed     start the emulators and load dev rules, but leave it empty
 *   --keep        do not wipe first (seeding will refuse if data is present)
 *   --skip-rules  do not run verify-rules.mjs (see below)
 */

import { spawn } from 'child_process';

const args = process.argv.slice(2);
const NO_SEED = args.includes('--no-seed');
const KEEP = args.includes('--keep');
const SKIP_RULES = args.includes('--skip-rules');

const HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;      // matches firebase.json
const AUTH_PORT = 9099;           // matches firebase.json
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

/**
 * Kill the emulator and everything it started.
 *
 * On Windows `spawn(..., { shell: true })` puts a cmd.exe between us and npx,
 * and npx starts java. Signalling the cmd leaves the java process holding 8080
 * and 9099, so the next `npm run dev:reset` finds its ports taken — and a run
 * that failed halfway leaves an emulator up with a seeded Firestore and no
 * logins, which looks exactly like the machine working. taskkill /T takes the
 * whole tree.
 */
const killEmulator = () => {
    if (emulator.killed || emulator.exitCode !== null) return;
    if (process.platform === 'win32' && emulator.pid) {
        spawn('taskkill', ['/pid', String(emulator.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
        emulator.kill('SIGINT');
    }
};

const stop = (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    killEmulator();
    // Give the emulator a moment to release its ports before we exit.
    setTimeout(() => process.exit(code), 1200);
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

// ── Wait for them to accept connections ───────────────────────────────────
//
// BOTH of them. `firebase emulators:start` brings Firestore up first and Auth
// a few seconds later, so waiting only on 8080 — which this did — let the seed
// start while 9099 was still dead. Everything up to the last step succeeded,
// account creation failed, and what was left behind was a fully seeded database
// with no way to log in. That is the bug this waits out.

/** Firestore answers on 8080 as soon as it is serving; any response will do. */
async function waitForFirestore() {
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
        try {
            await fetch(`http://${HOST}:${FIRESTORE_PORT}/`);
            return true;
        } catch {
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return false;
}

/**
 * Auth needs more than a response: it binds the port before the
 * identitytoolkit routes are mounted, and reports `authEmulator.ready` when it
 * is genuinely usable. seed-auth.mjs owns that check, so this imports it rather
 * than keeping a second copy that could drift.
 */
async function waitForAuth() {
    const { waitForAuthEmulator } = await import('./seed-auth.mjs');
    try {
        await waitForAuthEmulator({ timeoutMs: READY_TIMEOUT_MS });
        return true;
    } catch {
        return false;
    }
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
        bad(`Firestore did not come up on ${HOST}:${FIRESTORE_PORT} within ${READY_TIMEOUT_MS / 1000}s.`);
        return stop(1);
    }
    say(`Firestore is up on ${HOST}:${FIRESTORE_PORT}.`);

    if (!await waitForAuth()) {
        bad(`Auth did not become ready on ${HOST}:${AUTH_PORT} within ${READY_TIMEOUT_MS / 1000}s.`);
        bad('Without it the seed can create no logins, so this stops rather than');
        bad('leaving you a database you cannot sign in to.');
        return stop(1);
    }
    say(`Auth is up on ${HOST}:${AUTH_PORT}.`);

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

            // Then the same database read back under the REAL rules, once per
            // seeded role.
            //
            // Every step above runs under the DEV rules, which are wide open —
            // and the most persistent class of bug in this codebase is
            // invisible under them. A service function that lists more
            // documents than the caller's role may read is refused outright by
            // Firestore rather than narrowed, and six instances of it
            // (listCustomers, overriddenLicenceValue, getSaleItems, and the
            // three more found by the audit that followed the third) passed
            // every check above before this line existed. Leaving it to
            // "remember to run it" is what let the fourth one ship.
            //
            // Rules go back to dev afterwards, including when the check fails,
            // so what is left is what was there before: a permissive emulator
            // to develop against. --skip-rules leaves the step out.
            if (!SKIP_RULES) {
                await run(['scripts/emulator-rules.mjs', 'real'], 'loading real rules');
                try {
                    await run(['scripts/verify-rules.mjs'], 'rules verification');
                } finally {
                    await run(['scripts/emulator-rules.mjs', 'dev'], 'restoring dev rules');
                }
            }
        }
    } catch (err) {
        bad(err.message);
        // Take the emulator down with us. Leaving it up after a failed seed is
        // what made this hard to spot: a running emulator with a populated
        // Firestore and no Auth accounts looks like a working machine right up
        // until the login screen refuses you.
        bad('The emulator is being stopped — this database is not usable.');
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

  The emulator is back on the \x1b[1mdev\x1b[0m rules, which are wide open and
  prove nothing about authorisation.
  ${SKIP_RULES
        ? '\x1b[31mverify:rules was SKIPPED — run it before believing a screen works.\x1b[0m'
        : 'Every read was just checked under the real rules, once per seeded role.'}
  Re-check after changing a query:
    \x1b[1mnpm run emulator:rules real && npm run verify:rules\x1b[0m
    \x1b[1mnpm run emulator:rules dev\x1b[0m
\x1b[32m────────────────────────────────────────────────────────────\x1b[0m
`);
})();
