#!/usr/bin/env node
/**
 * Sign in as the seeded Super Admin and drive the safety-provenance rule on
 * `products` against the REAL Security Rules, asserting BOTH directions: a
 * write that should be accepted must be accepted, and one that should be
 * refused must be refused.
 *
 *   npm run verify:writes         # brings up the real rules itself
 *
 * ── What this covers, and it is one rule ─────────────────────────────────
 *
 * ONLY the `safetySource` provenance condition on `products` create and update
 * — `safetyProvenanceHolds()` in firestore.rules, and `assertSafetyProvenance()`
 * in src/services/products.js. Nothing else.
 *
 * Every other write in this codebase remains unchecked: the sale batch and its
 * five collections, the licence writes, the audit_log append path, the ledger
 * balance moves, the counters. A batch fails whole, so a write can be refused
 * by a collection the caller never sees on screen — the customers/sales case in
 * CLAUDE.md §6 — and nothing here would notice. This is one rule's worth of
 * cover, not a write harness. Do not read a green line as more than that.
 *
 * scripts/verify-rules.mjs is the sibling that does READS, all 49 of them
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
 * ── What this does NOT cover ─────────────────────────────────────────────
 *
 * Printed at the end of every run. The sharpest one is worth stating here too:
 * it cannot detect an evaluation error inside `carriesSafetyFigures()`. In this
 * engine `error || true` is TRUE, so an error is absorbed whenever a source is
 * present and propagates to a denial whenever one is absent — it would behave
 * correctly by luck, and every case below would still pass. The predicate is
 * therefore written with only operations that cannot error on any value these
 * fields can hold, and that was established separately by loading probe
 * rulesets that assert each sub-expression is TRUE (a denial then means false
 * OR error, and for an expression that must be true, either is a finding).
 * Redo that if the predicate changes; this file cannot do it for you.
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
import { STAFF, DEMO_PASSWORD } from './seed-data.mjs';

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

    const admin = STAFF.find(u => u.role === 'Super Admin');
    const cred = await signInWithEmailAndPassword(auth, admin.email, DEMO_PASSWORD);
    const profile = await S.getUser(cred.user.uid);
    if (!profile) throw new Error(`${admin.email} authenticated but has no users/ profile`);
    S.setActor({
        id: cred.user.uid, name: profile.name, role: profile.role,
        areaId: profile.areaId ?? null, territoryId: profile.territoryId ?? null,
    });
    console.log(`\nSigned in as ${profile.role} — ${admin.email} ${C.dim}(uid ${cred.user.uid})${C.off}\n`);

    // Preflight. Asked of the emulator directly rather than inferred from a
    // refusal: a write probe cannot tell "the rules refused this" from "that
    // document does not exist", and a green run under the DEV rules would be
    // the most dangerous output this file could produce.
    {
        const res = await fetch(`http://${HOST}/emulator/v1/projects/${PROJECT}:securityRules`);
        const loaded = (await res.json()).rules.files[0].content;
        const permissive = loaded.includes('allow read, write: if true');
        if (permissive || !loaded.includes('safetyProvenanceHolds')) {
            console.error(`${C.bad}The emulator is NOT on the real rules.${C.off}`);
            console.error(`  Loaded ruleset ${permissive ? 'is the permissive DEV copy' : 'has no safetyProvenanceHolds()'}.`);
            process.exit(2);
        }
        console.log(`${C.dim}Preflight: the loaded ruleset is firestore.rules and defines safetyProvenanceHolds().${C.off}\n`);
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
console.log(`  · ANY OTHER WRITE. One rule is checked here — safetyProvenanceHolds()
    on products. The sale batch and its five collections, licences, the
    audit_log append path, the ledger balances and the counters are all
    unchecked, and a batch fails whole.
  · An evaluation error inside the predicate. In this engine \`error || true\`
    is true, so an error would be absorbed when a source is present and would
    deny when one is absent — behaving correctly by luck, with every case above
    still passing. Ruling that out needs probe rulesets that assert each
    sub-expression is TRUE; see the header.
  · Roles other than Super Admin. Nobody else may write products at all, so
    there is no second role to compare against here.
  · Whether the Product page calls setSafetyData() correctly, or that its
    dialog gates on the same emptiness test the service does.`);

if (failures) {
    console.log(`\n${C.bad}${failures} of ${ran} cases did not behave as expected.${C.off}\n`);
    process.exit(1);
}
console.log(`\n${C.ok}All ${ran} cases behaved as firestore.rules and products.js say they should.${C.off}\n`);
