#!/usr/bin/env node
/**
 * Create the Firebase Auth accounts that go with the seeded users/ profiles.
 *
 * Called by seed.mjs, so `npm run dev:reset` produces a working login every
 * time. It can also be run on its own against a database that is already
 * seeded:
 *
 *     node scripts/seed-auth.mjs --emulator
 *
 * ── Why the UID is set explicitly ────────────────────────────────────────
 *
 * Every account is created with `localId` set to the user's own code
 * (AIO-000010, AIU-000003, …), which is also the users/ document ID. That is
 * not cosmetic:
 *
 *   · firestore.rules reads the caller's profile from users/{request.auth.uid}.
 *     If the UID were random, that lookup would miss and every rule that asks
 *     for a role would deny.
 *   · customers.officerId, sales.officerId and sale_items.officerId already
 *     hold officer codes, and the `mine()` rule compares them against
 *     request.auth.uid. Random UIDs would silently break Sales Officer scoping
 *     and there would be nothing to see — the rows would simply vanish.
 *
 * Letting Auth allocate the UID would mean rewriting those references on every
 * seed. Setting it is one line and keeps the seed data honest.
 *
 * ── Emulator only ────────────────────────────────────────────────────────
 *
 * Creating an account with a chosen UID is an admin operation. The emulator
 * accepts `Authorization: Bearer owner`; the real project would need a service
 * account key, which this repository deliberately does not carry. Against a
 * real project this script stops and says so rather than half-working.
 */

import { OFFICERS, STAFF, DEMO_PASSWORD, OFFICER_PERMISSIONS } from './seed-data.mjs';

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'agrivision-erp';

const base = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`;
const adminHeaders = {
    'Authorization': 'Bearer owner',      // the emulator's stand-in for a service account
    'Content-Type': 'application/json',
};

/** Everyone who gets a login, flattened into one shape. */
export function authAccounts() {
    return [
        ...OFFICERS.map(o => ({
            uid: o.code, email: o.email, name: o.name,
            role: 'Sales Officer', permissions: OFFICER_PERMISSIONS,
        })),
        ...STAFF.map(s => ({
            uid: s.code, email: s.email, name: s.name,
            role: s.role, permissions: s.permissions,
        })),
    ];
}

async function assertEmulatorReachable() {
    try {
        const res = await fetch(`http://${AUTH_HOST}/`);
        if (!res.ok) throw new Error(`status ${res.status}`);
    } catch (err) {
        throw new Error(
            `Auth emulator is not answering on ${AUTH_HOST} (${err.message}).\n` +
            `Start it with:  npm run emulators`,
        );
    }
}

/** Remove every account, so re-seeding does not trip over EMAIL_EXISTS. */
async function wipeAccounts() {
    const res = await fetch(
        `http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`,
        { method: 'DELETE', headers: adminHeaders },
    );
    if (!res.ok) throw new Error(`Could not clear Auth accounts: ${res.status} ${await res.text()}`);
}

async function createAccount({ uid, email, name }) {
    const res = await fetch(`${base}/accounts`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
            localId: uid,
            email,
            password: DEMO_PASSWORD,
            displayName: name,
            emailVerified: true,
        }),
    });
    if (!res.ok) {
        throw new Error(`Could not create ${email}: ${res.status} ${await res.text()}`);
    }
    return res.json();
}

/**
 * Wipe and recreate every login. Returns the number created.
 * Pass { quiet: true } when seed.mjs is driving and printing its own totals.
 */
export async function seedAuth({ quiet = false } = {}) {
    await assertEmulatorReachable();
    await wipeAccounts();

    const accounts = authAccounts();
    for (const account of accounts) {
        await createAccount(account);
        if (!quiet) console.log(`  ${account.uid.padEnd(12)} ${account.role.padEnd(18)} ${account.email}`);
    }
    return accounts.length;
}

// ── Run standalone ────────────────────────────────────────────────────────

const isMain = process.argv[1] && process.argv[1].endsWith('seed-auth.mjs');

if (isMain) {
    const EMULATOR = process.argv.includes('--emulator') || process.env.FIRESTORE_EMULATOR === '1';
    if (!EMULATOR) {
        console.error(
            '\nseed-auth.mjs only targets the Auth EMULATOR.\n\n' +
            'Creating an account with a chosen UID needs admin credentials, and this\n' +
            'repository carries no service account key. For the real project, create the\n' +
            'accounts in the Firebase Console and set each users/ document ID to the UID\n' +
            'the Console assigns (docs/FIRESTORE-SCHEMA.md §11, step 5).\n\n' +
            'Re-run as:  node scripts/seed-auth.mjs --emulator\n',
        );
        process.exit(1);
    }

    console.log(`\nCreating Auth accounts on ${AUTH_HOST} (password: ${DEMO_PASSWORD})\n`);
    seedAuth()
        .then(n => { console.log(`\n${n} accounts ready.\n`); process.exit(0); })
        .catch(err => { console.error(`\nseed-auth failed: ${err.message}\n`); process.exit(1); });
}
