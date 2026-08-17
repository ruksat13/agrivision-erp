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
 * ── It waits, and it checks ──────────────────────────────────────────────
 *
 * Two things here exist because this step used to fail quietly and leave a
 * seeded database nobody could sign in to:
 *
 *   · `waitForAuthEmulator()` blocks until the emulator reports itself ready.
 *     `firebase emulators:start` brings Firestore up several seconds before
 *     Auth, and a caller that only waited for Firestore got here too early.
 *   · `seedAuth()` signs in afterwards with a real password request. Creating
 *     an account returns 200 long before anyone has shown the login works, and
 *     the working login is the only thing this file is for.
 *
 * Every failure throws. Nothing here is best-effort.
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

// Any value works against the emulator, but using the app's own key keeps the
// sign-in check below identical to what the browser does.
const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCWAPj11h5NFw4xOuULvqR8F0WzJCrmecY';

const identityBase = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`;
const base = `${identityBase}/projects/${PROJECT_ID}`;
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

/**
 * Wait until the Auth emulator says it is ready, not merely until something
 * answers on the port.
 *
 * The emulator binds 9099 and starts serving before the identitytoolkit routes
 * are mounted, and `firebase emulators:start` brings Firestore up first — so a
 * caller that waited only for Firestore on 8080 would find 9099 dead or
 * half-open and fail. That was the bug: dev:reset seeded 285 documents and then
 * fell over on the last step, leaving a database nobody could log into.
 *
 * The root endpoint returns `{ authEmulator: { ready: true } }`, so this waits
 * for that flag rather than for any 200 — something else on the port would
 * answer, but it would not say this.
 */
export async function waitForAuthEmulator({ timeoutMs = 60_000, quiet = true } = {}) {
    const deadline = Date.now() + timeoutMs;
    let lastError = 'no response';
    let announced = false;

    while (Date.now() < deadline) {
        try {
            const res = await fetch(`http://${AUTH_HOST}/`);
            if (res.ok) {
                const body = await res.json();
                if (body?.authEmulator?.ready) return true;
                lastError = 'answered, but not reporting ready';
            } else {
                lastError = `status ${res.status}`;
            }
        } catch (err) {
            lastError = err.message;
        }
        if (!quiet && !announced) {
            console.log(`  waiting for the Auth emulator on ${AUTH_HOST}…`);
            announced = true;
        }
        await new Promise(r => setTimeout(r, 500));
    }

    throw new Error(
        `Auth emulator never became ready on ${AUTH_HOST} (${lastError}).\n` +
        `Start it with:  npm run emulators`,
    );
}

/** Every account the emulator currently holds. Also used by verify.mjs. */
export async function fetchAuthAccounts() {
    const res = await fetch(`${base}/accounts:query`, {
        method: 'POST', headers: adminHeaders, body: '{}',
    });
    if (!res.ok) throw new Error(`Could not list Auth accounts: ${res.status} ${await res.text()}`);
    const body = await res.json();
    return body.userInfo || [];
}

/**
 * Actually sign in. Creating an account returns 200 long before anyone has
 * proved a password works against it, and "the login works" is the only thing
 * this script exists to guarantee — so it is asserted rather than assumed.
 * Returns the UID the emulator hands back, which must be the seeded code.
 */
export async function signInCheck(email, password = DEMO_PASSWORD) {
    const res = await fetch(`${identityBase}/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.idToken) {
        // The body is already consumed, so report what was parsed out of it
        // rather than reading it a second time.
        const detail = body?.error?.message || (Object.keys(body).length ? JSON.stringify(body) : 'no body');
        throw new Error(`${email} cannot log in: ${res.status} ${detail}`);
    }
    return body.localId;
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
    const body = await res.json();
    // The UID is the whole point (see the header): firestore.rules looks the
    // caller up at users/{request.auth.uid}, and officer codes are compared
    // against it. An account created under a different id would log in and then
    // show an empty, permission-denied application.
    if (body.localId !== uid) {
        throw new Error(`${email} was created as ${body.localId}, not ${uid}. Security Rules would deny this account.`);
    }
    return body;
}

/**
 * Wipe and recreate every login, then prove one works. Returns the number
 * created. Pass { quiet: true } when seed.mjs is driving and printing its own
 * totals.
 *
 * Every failure path throws. A caller that carries on after this rejects is
 * reporting a seeded database that nobody can sign in to, which is the failure
 * this script is here to prevent.
 */
export async function seedAuth({ quiet = false } = {}) {
    await waitForAuthEmulator({ quiet });
    await wipeAccounts();

    const accounts = authAccounts();
    for (const account of accounts) {
        await createAccount(account);
        if (!quiet) console.log(`  ${account.uid.padEnd(12)} ${account.role.padEnd(18)} ${account.email}`);
    }

    // Read it back through the front door. One admin and one Sales Officer,
    // because they exercise the two different shapes of users/ document and the
    // officer is the one whose UID is compared against sales.officerId.
    const proofs = [
        accounts.find(a => a.role === 'Super Admin'),
        accounts.find(a => a.role === 'Sales Officer'),
    ].filter(Boolean);

    for (const account of proofs) {
        const uid = await signInCheck(account.email);
        if (uid !== account.uid) {
            throw new Error(`${account.email} signed in as ${uid}, not ${account.uid}.`);
        }
        if (!quiet) console.log(`  sign-in verified: ${account.email} → ${uid}`);
    }

    const present = await fetchAuthAccounts();
    if (present.length !== accounts.length) {
        throw new Error(`Created ${accounts.length} accounts but the emulator holds ${present.length}.`);
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
