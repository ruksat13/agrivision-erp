#!/usr/bin/env node
/**
 * Drive the write rules this file covers against the REAL Security Rules,
 * asserting BOTH directions: a write that should be accepted must be accepted,
 * and one that should be refused must be refused.
 *
 *   npm run verify:writes         # brings up the real rules itself
 *
 * ── What this covers, and it is two rules ────────────────────────────────
 *
 * 1. The `safetySource` provenance condition on `products` create and update —
 *    `safetyProvenanceHolds()` in firestore.rules, and
 *    `assertSafetyProvenance()` in src/services/products.js. Driven as the
 *    seeded Super Admin, because nobody else may write `products` at all.
 *
 * 2. The self-edit condition on `users` update — `editingOwnProfile()` in
 *    firestore.rules, and `updateMyProfile()` in src/services/users.js. A
 *    signed-in user may change `name` and `phone` on their OWN document and
 *    nothing else; `role`, `permissions`, `areaId`, `status`, `email` and the
 *    rest stay Super Admin only (docs/DECISIONS.md, Platform).
 *
 *    Every escalation case there is driven as a NON-Super-Admin — the seeded
 *    Area Manager and the seeded Sales Officer — and that is the point. A
 *    Super Admin may legitimately change a role, so proving refusal as one
 *    would prove nothing at all. The Super Admin appears in that section once,
 *    as the positive control: they edit another user's role and it is allowed.
 *
 * Nothing else. Every other write in this codebase remains unchecked: the sale
 * batch and its five collections, the licence writes, the audit_log append
 * path, the ledger balance moves, the counters. A batch fails whole, so a write
 * can be refused by a collection the caller never sees on screen — the
 * customers/sales case in CLAUDE.md §6 — and nothing here would notice. This is
 * two rules' worth of cover, not a write harness. Do not read a green line as
 * more than that.
 *
 * scripts/verify-rules.mjs is the sibling that does READS, all 50 of them
 * against 6 roles. Between them they still leave most of the write surface
 * uncovered.
 *
 * ── Why the assertions are on the outcome, never on the message ──────────
 *
 * This emulator appends "evaluation error at L<line>:<col>" to the
 * PERMISSION_DENIED text of ANY rule expression that read
 * request.resource.data and came out false. A rule of
 * `request.resource.data.mrp == 12345` produces the identical wording. So the
 * message cannot distinguish "the rule said no" from "the rule blew up", and
 * asserting on it would be asserting on noise. Every case below asserts
 * ALLOWED or REFUSED and nothing else.
 *
 * ── What this does NOT cover ───────────────────────────────────────────
 *
 * Printed at the end of every run. The sharpest one is worth stating here too,
 * because it is the finding that shaped both predicates: the ALLOWED/REFUSED
 * matrix below cannot detect an evaluation error inside one. In this engine
 * `error || true` is TRUE, so an error is absorbed by a surrounding `||`
 * wherever the other operand is true, and propagates to a denial everywhere
 * else — it would behave correctly by luck, and every case below would still
 * pass. `carriesSafetyFigures()` is absorbed whenever a source is present.
 * `editingOwnProfile()` sits to the right of `isSuperAdmin() ||`, so an error
 * in it is absorbed for a Super Admin and denies for everybody else — which
 * reads exactly like a working rule, and would make /profile dead for the
 * eleven logins it was just built for.
 *
 * Both predicates are therefore written with only operations that cannot error
 * on any value these fields can hold, and that is not assumed. Section 12 below
 * PROVES it for the `users` predicate, with the technique that established it
 * for the safety one: load a probe ruleset whose only condition IS the
 * sub-expression, and assert it ALLOWS — a denial means false-or-error, and for
 * an expression that must be true, either is a finding. Then load a second
 * probe holding its NEGATION, and assert THAT allows for every shape the
 * expression must call false. Between the two, each shape is proved to have
 * come out a boolean rather than blown up. A denial cannot be told from an
 * error by its message, which is why it has to be done this way round.
 *
 * Redo that if either predicate changes; the ordinary cases cannot do it for
 * you.
 *
 * ── It cleans up after itself ────────────────────────────────────────────
 *
 * It writes to the seeded catalogue, so it loads the real rules, runs, then
 * re-seeds and puts the DEV rules back in a finally block. It cannot leave a
 * half-mutated database or the real rules behind. Deliberately NOT wired into
 * dev:reset — run it on demand.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { STAFF, OFFICERS, DEMO_PASSWORD } from './seed-data.mjs';

process.env.REACT_APP_USE_EMULATOR = 'true';
register(new URL('./cra-esm-hooks.mjs', import.meta.url).href);
const S = await import(new URL('../src/services/index.js', import.meta.url).href);
const { auth, db } = await import(new URL('../src/firebase.js', import.meta.url).href);

const C = { ok: '\x1b[32m', bad: '\x1b[31m', warn: '\x1b[33m', dim: '\x1b[90m', off: '\x1b[0m' };
const HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const PROJECT = process.env.GCLOUD_PROJECT || 'agrivision-erp';
const script = (name) => fileURLToPath(new URL(name, import.meta.url));

const TARGET = 'AI-000730';     // seeded with no safety data at all
const OTHER = 'AI-000104';      // seeded with placeholder figures AND a source

let failures = 0;
let ran = 0;

// ── Running the emulator's own controls ──────────────────────────────────

function loadRules(which) {
    execFileSync(process.execPath, [script('emulator-rules.mjs'), which], { stdio: 'pipe' });
}

function reseed() {
    execFileSync(process.execPath, [script('seed.mjs'), '--emulator', '--wipe'], { stdio: 'pipe' });
}

// ── Signing in ───────────────────────────────────────────────────────────
//
// Every escalation case in section 9 has to be driven by somebody who is NOT a
// Super Admin, so this file signs in more than once. The actor is set exactly
// as AuthContext.remember() does — the WHOLE shaped profile, not just
// id/name/role — because actorScope() reads areaId off it (CLAUDE.md §5), and
// an Area Manager recorded without one lists nothing, which would read here as
// a rules failure. startSession() is deliberately not used: it sets only
// { id, name, role } and it writes a login entry, which a verification run has
// no business doing.

const ACCOUNTS = [
    ...STAFF.map(u => ({ email: u.email, role: u.role })),
    { email: OFFICERS[0].email, role: 'Sales Officer' },
];

async function signInAs(role) {
    const account = ACCOUNTS.find(a => a.role === role);
    if (!account) throw new Error(`No seeded account for role ${role}`);
    await signOut(auth).catch(() => { });
    const cred = await signInWithEmailAndPassword(auth, account.email, DEMO_PASSWORD);
    const profile = await S.getUser(cred.user.uid);
    if (!profile) throw new Error(`${account.email} authenticated but has no users/ profile`);
    S.setActor({
        id: cred.user.uid, name: profile.name, role: profile.role,
        areaId: profile.areaId ?? null, territoryId: profile.territoryId ?? null,
    });
    console.log(`\nSigned in as ${profile.role} — ${account.email} ${C.dim}(uid ${cred.user.uid})${C.off}\n`);
    return { uid: cred.user.uid, email: account.email, profile };
}

// ── One case ─────────────────────────────────────────────────────────────

async function check(label, expected, fn) {
    ran += 1;
    let outcome, text;
    try {
        await fn();
        outcome = 'ALLOWED';
        text = 'no error thrown';
    } catch (err) {
        outcome = 'REFUSED';
        text = `${err.name} [${err.code ?? '-'}]: ${String(err.message).replace(/\s+/g, ' ')}`;
    }
    const good = outcome === expected;
    if (!good) failures += 1;
    console.log(`  ${good ? `${C.ok}PASS${C.off}` : `${C.bad}FAIL${C.off}`}  ${label}`);
    console.log(`        expected ${expected}, got ${outcome}`);
    console.log(`        ${C.dim}${text}${C.off}\n`);
}

// ── The payloads ─────────────────────────────────────────────────────────

const FIGURES = {
    whoClass: 'II',
    signalWordBn: 'বিষাক্ত',
    phiDays: 0,                        // zero is a recorded figure, not an absence
    reentryHours: 0,
    firstAidBn: 'পরীক্ষার তথ্য',
    dosageBn: 'পরীক্ষার মাত্রা',
    approvedCropsBn: ['ধান'],
};
const CLEARED = {
    whoClass: null, signalWordBn: null, phiDays: null, reentryHours: null,
    firstAidBn: null, dosageBn: null, approvedCropsBn: null, safetySource: null,
};
const SOURCE = 'PLACEHOLDER - verify:writes, not from a label';

/** A write straight at Firestore, past the service layer — the caller the rule
 *  exists for. The service never sends these shapes; that is the point. */
const raw = (patch) => updateDoc(doc(db, 'products', TARGET), patch);

// ── The run ──────────────────────────────────────────────────────────────

try {
    loadRules('real');

    await signInAs('Super Admin');

    // Preflight. Asked of the emulator directly rather than inferred from a
    // refusal: a write probe cannot tell "the rules refused this" from "that
    // document does not exist", and a green run under the DEV rules would be
    // the most dangerous output this file could produce.
    {
        const res = await fetch(`http://${HOST}/emulator/v1/projects/${PROJECT}:securityRules`);
        const loaded = (await res.json()).rules.files[0].content;
        const permissive = loaded.includes('allow read, write: if true');
        const absent = ['safetyProvenanceHolds', 'editingOwnProfile'].filter(f => !loaded.includes(f));
        if (permissive || absent.length) {
            console.error(`${C.bad}The emulator is NOT on the real rules.${C.off}`);
            console.error(`  Loaded ruleset ${permissive ? 'is the permissive DEV copy' : `does not define ${absent.join(' or ')}`}.`);
            process.exit(2);
        }
        console.log(`${C.dim}Preflight: the loaded ruleset is firestore.rules and defines both`
            + ` safetyProvenanceHolds() and editingOwnProfile().${C.off}\n`);
    }

    // ── 0. The catalogue as seeded, before anything below writes ─────────
    // A product already holding figures with no source would be refused every
    // future update by the rule below, so it is worth knowing there is not one.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('0. The seeded catalogue\n');
    {
        const SAFETY_FIELDS = ['whoClass', 'signalWordBn', 'phiDays', 'reentryHours',
            'firstAidBn', 'dosageBn', 'approvedCropsBn'];
        const isRecorded = (v) => {
            if (v == null) return false;
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === 'string') return v.trim() !== '';
            return true;
        };
        const snap = await getDocs(collection(db, 'products'));
        const offenders = [];
        let withFigures = 0;
        snap.forEach(d => {
            const p = d.data();
            const carried = SAFETY_FIELDS.filter(f => isRecorded(p[f]));
            if (!carried.length) return;
            withFigures += 1;
            const src = typeof p.safetySource === 'string' ? p.safetySource.trim() : '';
            if (!src) offenders.push({ code: d.id, name: p.name, carried });
            else console.log(`  ${C.dim}${d.id}  ${p.name} — ${p.safetySource}${C.off}`);
        });
        console.log(`\n  ${snap.size} products; ${withFigures} carry safety figures.`);
        if (offenders.length) {
            failures += 1;
            console.log(`  ${C.bad}${offenders.length} carry figures with no source, and would be refused`);
            console.log(`  every future update by the rule this file checks:${C.off}`);
            offenders.forEach(o => console.log(`    ${o.code}  ${o.name} — ${o.carried.join(', ')}`));
        } else {
            console.log(`  ${C.ok}None carries figures with a missing or empty safetySource.${C.off}`);
        }
        console.log('');
    }

    // ── 1. Figures with no source, through the service layer ─────────────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('1. Figures with no source, through setSafetyData()\n');
    await check('setSafetyData(all seven, no source)', 'REFUSED',
        () => S.setSafetyData(TARGET, { ...FIGURES }));
    await check('setSafetyData(phiDays: 0 alone, no source) — 0 is a figure', 'REFUSED',
        () => S.setSafetyData(TARGET, { phiDays: 0 }));
    await check('setSafetyData(approvedCropsBn: [] alone, no source) — [] is an absence', 'ALLOWED',
        () => S.setSafetyData(TARGET, { approvedCropsBn: [] }));

    // ── 2. The same writes past the service layer ────────────────────────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('2. The same writes straight at Firestore, past the service layer\n');
    await check('updateDoc(all seven, safetySource: null)', 'REFUSED',
        () => raw({ ...FIGURES, safetySource: null }));
    await check('updateDoc(all seven, safetySource: "   ") — whitespace is not a source', 'REFUSED',
        () => raw({ ...FIGURES, safetySource: '   ' }));
    await check('updateDoc(phiDays: 0 alone, source null) — 0 is a figure', 'REFUSED',
        () => raw({ ...CLEARED, phiDays: 0 }));
    await check('updateDoc(reentryHours: 0 alone, source null)', 'REFUSED',
        () => raw({ ...CLEARED, reentryHours: 0 }));
    await check('updateDoc(approvedCropsBn: ["ধান"] alone, source null)', 'REFUSED',
        () => raw({ ...CLEARED, approvedCropsBn: ['ধান'] }));
    await check('updateDoc(approvedCropsBn: [] alone, source null) — [] is an absence', 'ALLOWED',
        () => raw({ ...CLEARED, approvedCropsBn: [] }));
    await check('updateDoc(all seven null, safetySource: "a source") — a source alone is fine', 'ALLOWED',
        () => raw({ ...CLEARED, safetySource: 'a source with nothing under it' }));

    // ── 3. The blank-string hole ─────────────────────────────────────────
    // This case was in the first version of this matrix expecting ALLOWED,
    // labelled "blank is an absence", which locked the defect in as intended
    // behaviour. The service calls a blank string an absence AND normalises it
    // to null, so the pair is consistent there. The rules cannot normalise —
    // allowing it stores '   ' verbatim, hasSafetyData() then returns true on
    // it, and the invoice prints a panel of blanks under a blank source line.
    // So the rules count a blank figure as a value and refuse it.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('3. A blank string is data to hasSafetyData(), so the rules refuse it\n');
    await check('updateDoc(firstAidBn: "   " alone, source null) — past the service layer', 'REFUSED',
        () => raw({ ...CLEARED, firstAidBn: '   ' }));
    await check('updateDoc(firstAidBn: "   " alone, WITH a source) — provenance is stated', 'ALLOWED',
        () => raw({ ...CLEARED, firstAidBn: '   ', safetySource: 'a label' }));
    await check('setSafetyData(firstAidBn: "   ", no source) — the service normalises it to null', 'ALLOWED',
        () => S.setSafetyData(TARGET, { firstAidBn: '   ' }));
    {
        const after = (await getDoc(doc(db, 'products', TARGET))).data();
        const clean = after.firstAidBn === null;
        if (!clean) failures += 1;
        console.log(`  ${clean ? `${C.ok}PASS${C.off}` : `${C.bad}FAIL${C.off}`}  `
            + `…and stored it as null, not as "   "`);
        console.log(`        ${C.dim}stored firstAidBn=${JSON.stringify(after.firstAidBn)} `
            + `hasSafetyData=${S.hasSafetyData(after)}${C.off}\n`);
        ran += 1;
    }

    // ── 4. The same figures WITH a source ────────────────────────────────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('4. The same figures with a source\n');
    await check('setSafetyData(all seven, source)', 'ALLOWED',
        () => S.setSafetyData(TARGET, { ...FIGURES, safetySource: SOURCE }));
    {
        const after = (await getDoc(doc(db, 'products', TARGET))).data();
        console.log(`        ${C.dim}stored: whoClass=${after.whoClass} phiDays=${after.phiDays} `
            + `reentryHours=${after.reentryHours} approvedCropsBn=${JSON.stringify(after.approvedCropsBn)}`
            + `\n        safetySource=${JSON.stringify(after.safetySource)}${C.off}\n`);
    }

    // ── 5. Unrelated updates to a product that holds figures ─────────────
    // request.resource.data is the MERGED document on an update, so the figures
    // and the source both survive a write that never mentions them.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('5. Unrelated updates to a product that already holds figures\n');
    await check(`updateDoc(${TARGET}, { mrp: 999 }) — the merge keeps figures and source`, 'ALLOWED',
        () => raw({ mrp: 999 }));
    await check(`updateProduct(${TARGET}, { status }) — Inactive, then Active again`, 'ALLOWED',
        async () => {
            await S.updateProduct(TARGET, { status: 'Inactive' });
            await S.updateProduct(TARGET, { status: 'Active' });
        });
    await check('updateDoc(safetySource: null) on a product that HOLDS figures — strips provenance', 'REFUSED',
        () => raw({ safetySource: null }));

    // ── 6. Clearing ──────────────────────────────────────────────────────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('6. Clearing safety data — all seven null with a null source\n');
    await check(`setSafetyData(${TARGET}, {}) — the Clear safety data button`, 'ALLOWED',
        () => S.setSafetyData(TARGET, {}));
    {
        const after = (await getDoc(doc(db, 'products', TARGET))).data();
        console.log(`        ${C.dim}stored: whoClass=${after.whoClass} phiDays=${after.phiDays} `
            + `approvedCropsBn=${after.approvedCropsBn} safetySource=${after.safetySource}`
            + ` — hasSafetyData=${S.hasSafetyData(after)}${C.off}\n`);
    }

    // ── 7. A product with no safety data is untouched by any of this ─────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('7. Products the rule has no business blocking\n');
    await check(`updateProduct(${OTHER}, { status: 'Inactive' }) — it holds placeholder figures`, 'ALLOWED',
        () => S.updateProduct(OTHER, { status: 'Inactive' }));
    await check(`updateProduct(${OTHER}, { status: 'Active' }) — put it back`, 'ALLOWED',
        () => S.updateProduct(OTHER, { status: 'Active' }));
    await check(`updateDoc(${TARGET}, { buyPrice: 12.5 }) — no safety data at all`, 'ALLOWED',
        () => raw({ buyPrice: 12.5 }));

    // ── 8. Create, not just update ───────────────────────────────────────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('8. The create path\n');
    await check('createProduct(figures, no source) — the service guard', 'REFUSED',
        () => S.createProduct({
            code: 'AI-TMP-001', name: 'verify:writes throwaway', category: 'Pesticide',
            unitId: 'KG', packSize: '1 KG', type: 'Finished', mrp: 1, ...FIGURES,
        }));
    await check('setDoc(AI-TMP-002, figures, no source) — past the service layer', 'REFUSED',
        () => setDoc(doc(db, 'products', 'AI-TMP-002'), {
            code: 'AI-TMP-002', name: 'verify:writes throwaway', category: 'Pesticide',
            unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 1, type: 'Finished',
            mrp: 1, status: 'Active', ...FIGURES, safetySource: null,
        }));
    await check('setDoc(AI-TMP-003, no safety fields at all) — a plain new product', 'ALLOWED',
        () => setDoc(doc(db, 'products', 'AI-TMP-003'), {
            code: 'AI-TMP-003', name: 'verify:writes throwaway', category: 'Pesticide',
            unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 1, type: 'Finished',
            mrp: 1, status: 'Active',
        }));

    // ── 9. users — a self-edit is two fields, and nothing else ─────
    //
    // Driven as the seeded Area Manager and the seeded Sales Officer. NOT as a
    // Super Admin: they may legitimately change a role, so every refusal proved
    // as one would be the rule's OTHER arm answering, and would prove nothing
    // about editingOwnProfile(). Section 11 runs the Super Admin on purpose, as
    // the positive control that this is a restriction and not a wall.
    //
    // The raw cases go straight at Firestore. updateMyProfile() refuses a stray
    // field before it leaves the browser, which is the convenience half — these
    // are the caller the rule exists for, who never went through the screen.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('9. users — a self-edit, driven as a NON-Super-Admin\n');

    const SOMEONE_ELSE = STAFF.find(u => u.role === 'Storekeeper').code;

    async function selfEditCases(role) {
        const { uid, profile } = await signInAs(role);
        const rawSelf = (patch) => updateDoc(doc(db, 'users', uid), patch);
        const held = Array.isArray(profile.permissions) ? profile.permissions : [];
        const tag = Date.now();

        console.log(`  ${C.dim}— through the service layer —${C.off}\n`);
        await check(`[${role}] updateMyProfile({ name }) — own name alone`, 'ALLOWED',
            () => S.updateMyProfile({ name: `${profile.name} [svc ${tag}]` }));
        await check(`[${role}] updateMyProfile({ phone }) — own phone alone`, 'ALLOWED',
            () => S.updateMyProfile({ phone: '01700-000001' }));
        await check(`[${role}] updateMyProfile({ name, phone }) — together`, 'ALLOWED',
            () => S.updateMyProfile({ name: `${profile.name} [both ${tag}]`, phone: '01700-000002' }));
        await check(`[${role}] updateMyProfile({ role: 'Super Admin' }) — the service guard`, 'REFUSED',
            () => S.updateMyProfile({ role: 'Super Admin' }));

        console.log(`  ${C.dim}— straight at Firestore, past the service layer —${C.off}\n`);
        await check(`[${role}] own name alone`, 'ALLOWED',
            () => rawSelf({ name: `${profile.name} [raw ${tag}]` }));
        await check(`[${role}] own phone alone`, 'ALLOWED',
            () => rawSelf({ phone: '01700-000003' }));
        await check(`[${role}] own name and phone together`, 'ALLOWED',
            () => rawSelf({ name: `${profile.name} [raw both ${tag}]`, phone: '01700-000004' }));

        await check(`[${role}] own name PLUS role -> 'Super Admin'`, 'REFUSED',
            () => rawSelf({ name: `${profile.name} [esc ${tag}]`, role: 'Super Admin' }));
        await check(`[${role}] role -> 'Super Admin' alone`, 'REFUSED',
            () => rawSelf({ role: 'Super Admin' }));
        await check(`[${role}] own name PLUS permissions -> 'all'`, 'REFUSED',
            () => rawSelf({ name: `${profile.name} [esc2 ${tag}]`, permissions: 'all' }));
        await check(`[${role}] permissions widened by one path (/admin)`, 'REFUSED',
            () => rawSelf({ permissions: [...held, '/admin'] }));
        await check(`[${role}] own areaId alone`, 'REFUSED',
            () => rawSelf({ areaId: 'dhaka-north' }));
        await check(`[${role}] own officerId alone`, 'REFUSED',
            () => rawSelf({ officerId: OFFICERS[0].code }));
        await check(`[${role}] own status alone`, 'REFUSED',
            () => rawSelf({ status: 'Inactive' }));
        await check(`[${role}] own email alone`, 'REFUSED',
            () => rawSelf({ email: 'somebody-else@agrivision.com' }));
        await check(`[${role}] setDoc(own doc, { name, phone }) — drops the other nine fields`, 'REFUSED',
            () => setDoc(doc(db, 'users', uid), { name: `${profile.name} [overwrite ${tag}]`, phone: '01700-000005' }));
        await check(`[${role}] another user's name (${SOMEONE_ELSE})`, 'REFUSED',
            () => updateDoc(doc(db, 'users', SOMEONE_ELSE), { name: `not yours ${tag}` }));

        return { uid, profile };
    }

    const manager = await selfEditCases('Area Manager');

    // ── 10. The audit entry the self-edit left ─────────────────────
    //
    // Still signed in as the Area Manager, who may read audit_log. A self-edit
    // that cannot be reconstructed is not a control: the entry has to name the
    // person, the document and - through `before` - the whole profile as it
    // stood, so "who changed this name, and from what" has an answer.
    //
    // listAudit() with no filter, on purpose: one orderBy and no where(), so a
    // verification run implies no composite index the app does not already
    // need. The emulator would serve either, which is exactly why it is worth
    // not relying on.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('10. The audit entry a self-edit leaves\n');
    {
        const rows = await S.listAudit({ limit: 100 });
        const entry = rows.find(r => r.collection === 'users' && r.docId === manager.uid && r.action === 'update');
        const good = Boolean(entry)
            && entry.userId === manager.uid
            && typeof entry.before?.name === 'string'
            && entry.before.name.length > 0
            && entry.before.role === 'Area Manager'
            && entry.after?.name !== entry.before.name;
        if (!good) failures += 1;
        ran += 1;
        console.log(`  ${good ? `${C.ok}PASS${C.off}` : `${C.bad}FAIL${C.off}`}  `
            + 'the update carries an audit entry holding the previous document');
        console.log(`        ${C.dim}${entry
            ? `action=${entry.action} userId=${entry.userId} userRole=${entry.userRole}\n`
            + `        before.name=${JSON.stringify(entry.before?.name)} before.role=${JSON.stringify(entry.before?.role)}\n`
            + `        after.name=${JSON.stringify(entry.after?.name)}`
            : 'no audit_log entry found for this document'}${C.off}\n`);
    }

    await selfEditCases('Sales Officer');

    // ── 11. The positive control — the role that MAY ───────────────
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('11. A Super Admin editing another user — the arm that stays open\n');
    await signInAs('Super Admin');
    await check(`updateUser(${SOMEONE_ELSE}, { role: 'Accountant' }) — another user's role`, 'ALLOWED',
        () => S.updateUser(SOMEONE_ELSE, { role: 'Accountant' }));
    await check(`updateUser(${SOMEONE_ELSE}, { role: 'Storekeeper' }) — and back`, 'ALLOWED',
        () => S.updateUser(SOMEONE_ELSE, { role: 'Storekeeper' }));
    await check(`updateUser(${SOMEONE_ELSE}, { permissions: 'all' }) — and the other field`, 'ALLOWED',
        () => S.updateUser(SOMEONE_ELSE, { permissions: 'all' }));

    // ── 12. Probes — proving the predicate evaluates, not errors ──────
    //
    // The matrix above cannot tell a denial from an evaluation error; the
    // header says why, and why that matters more here than it looks. So the
    // sub-expression is lifted out of the rule and made the WHOLE condition of
    // a throwaway ruleset, twice:
    //
    //   probe A   allow update: if <predicate>      self-edit shapes must ALLOW
    //   probe B   allow update: if !(<predicate>)   escalation shapes must ALLOW
    //
    // An ALLOW cannot be produced by an error, so each half proves the shapes
    // it allows came out a boolean. Between them every shape below is covered
    // in the direction that proves something. The opposite direction is run too
    // and is only a consistency check — a REFUSED there is equally consistent
    // with false and with an error, which is the whole problem.
    //
    // The probes run against a throwaway users/ document with no Auth account,
    // reset to a known state before every case: under probe B an escalation
    // shape that happened to be a no-op would leave affectedKeys() empty, the
    // predicate true and the negation false, which reads as a finding when it
    // is only a stale fixture.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log('12. Probe rulesets — the predicate evaluates, it does not error\n');
    {
        const PREDICATE = "request.resource.data.diff(resource.data).affectedKeys()"
            + ".hasOnly(['name', 'phone', 'updatedAt'])";
        const PROBE_DOC = 'AIU-PROBE1';
        const PROBE_BASE = {
            name: 'Probe subject', email: 'probe@agrivision.com', role: 'Storekeeper',
            permissions: ['/'], officeId: 'head', areaId: 'bogura-sadar', territoryId: null,
            employeeId: null, customerId: null, status: 'Inactive', phone: '01700-999999',
        };
        const PERMISSIVE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}`;
        const probeRules = (expr) => `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;
      allow update: if ${expr};
    }
  }
}`;

        async function putRules(content) {
            const res = await fetch(`http://${HOST}/emulator/v1/projects/${PROJECT}:securityRules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content }] } }),
            });
            if (!res.ok) throw new Error(`ruleset rejected: ${res.status} ${await res.text()}`);
        }

        const SELF_SHAPES = [
            ['name alone', { name: 'probe name' }],
            ['phone alone', { phone: '01700-111111' }],
            ['name and phone', { name: 'probe both', phone: '01700-222222' }],
            ['name and updatedAt', { name: 'probe stamped', updatedAt: new Date() }],
        ];
        const ESCALATION_SHAPES = [
            ['name PLUS role', { name: 'probe esc', role: 'Super Admin' }],
            ['role alone', { role: 'Super Admin' }],
            ['name PLUS permissions', { name: 'probe esc', permissions: 'all' }],
            ['permissions widened', { permissions: ['/', '/admin'] }],
            ['areaId alone', { areaId: 'dhaka-north' }],
            ['officerId alone', { officerId: OFFICERS[0].code }],
            ['status alone', { status: 'Active' }],
            ['email alone', { email: 'probe-changed@agrivision.com' }],
        ];

        async function probe(expr, shapes, expected, note) {
            for (const [label, patch] of shapes) {
                await putRules(PERMISSIVE);
                await setDoc(doc(db, 'users', PROBE_DOC), PROBE_BASE);
                await putRules(probeRules(expr));
                await check(`${note}  ${label}`, expected,
                    () => updateDoc(doc(db, 'users', PROBE_DOC), patch));
            }
        }

        console.log(`  ${C.dim}probe A — allow update: if <predicate>${C.off}\n`);
        await probe(PREDICATE, SELF_SHAPES, 'ALLOWED', 'A: PROVES TRUE  .');
        await probe(PREDICATE, ESCALATION_SHAPES, 'REFUSED', 'A: consistency  .');

        console.log(`  ${C.dim}probe B — allow update: if !(<predicate>)${C.off}\n`);
        await probe(`!(${PREDICATE})`, ESCALATION_SHAPES, 'ALLOWED', 'B: PROVES FALSE .');
        await probe(`!(${PREDICATE})`, SELF_SHAPES, 'REFUSED', 'B: consistency  .');

        console.log(`  ${C.dim}Every shape above was ALLOWED by exactly one of the two probes, so`);
        console.log(`  the predicate returned a boolean for all of them. An evaluation error`);
        console.log(`  can only ever deny, so it cannot produce either half of that.${C.off}\n`);
    }

    await signOut(auth).catch(() => { });
} finally {
    // Undo everything above, whatever happened. The seed wipes and rewrites the
    // collections it owns, which is what takes AI-TMP-003 and the mutations to
    // AI-000730 back out, and the audit entries the service writes with them.
    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log(`${C.dim}Restoring: dev rules, re-seed, dev rules left loaded.${C.off}`);
    try {
        loadRules('dev');
        reseed();
        console.log(`${C.dim}Emulator re-seeded and left on the DEV rules.${C.off}\n`);
    } catch (err) {
        console.error(`${C.bad}CLEAN-UP FAILED — the database may be half-mutated.${C.off}`);
        console.error(`  ${err.message}`);
        console.error('  Fix:  npm run dev:reset\n');
        process.exitCode = 3;
    }
}

// ── What a green line here does not mean ─────────────────────────────────

console.log(`${C.warn}This run does not cover:${C.off}`);
console.log(`  · ANY OTHER WRITE. Two rules are checked here — safetyProvenanceHolds()
    on products, and editingOwnProfile() on users. The sale batch and its five
    collections, licences, the audit_log append path, the ledger balances and
    the counters are all unchecked, and a batch fails whole.
  · Roles with no seeded account. Delivery Man and Dealer are in ROLE and
    have neither a login nor a grant in firestore.rules, so there is nothing
    here to sign in as and nothing to assert about them.
  · The products rule against any role but Super Admin. Nobody else may write
    products at all, so there is no second role to compare against there.
  · Whether the screens call the services correctly — that the Product dialog
    gates on the same emptiness test setSafetyData() does, or that /profile
    sends only the two fields updateMyProfile() accepts.
  · WHAT a self-edit stores. The users predicate constrains WHICH fields may
    differ and nothing about their values: name may be set to a number or to
    an empty string past the service layer, and the rules will take it. A type
    test would introduce exactly the evaluation error section 12 exists to rule
    out, so that guard is deliberately left in updateMyProfile() alone. It is a
    data-quality gap, not an authorisation one — no shape of it moves a role,
    a permission or a scope.

${C.dim}What it DOES now cover that a matrix alone cannot: section 12 proves both
directions of the users predicate with probe rulesets, so a passing run above
is not passing by evaluation error. Redo that section if the predicate
changes — a denial and an error are indistinguishable from the message this
emulator returns.${C.off}`);

if (failures) {
    console.log(`\n${C.bad}${failures} of ${ran} cases did not behave as expected.${C.off}\n`);
    process.exit(1);
}
console.log(`\n${C.ok}All ${ran} cases behaved as firestore.rules, products.js and users.js say they should.${C.off}\n`);
