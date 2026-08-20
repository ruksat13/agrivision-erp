#!/usr/bin/env node
/**
 * Sign in as every seeded role and call every read in src/services against the
 * REAL Security Rules, asserting BOTH directions: that a read the role is
 * entitled to succeeds, and that a read it is not entitled to is refused.
 *
 *   npm run verify:rules          # emulator must be on the real rules
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * One bug has now been found four times in this codebase, always the same way:
 * a service function issues a LIST for more documents than the caller's role
 * may read, and Firestore refuses the WHOLE query rather than narrowing it.
 * Rules are not filters (CLAUDE.md §5).
 *
 *   listCustomers()          SalesEntry showed zero dealers to the officer who
 *                            owned them — "permission-denied"
 *   overriddenLicenceValue() the compliance report was empty for an Area
 *                            Manager, then still empty one level further down
 *                            because sale_items needed the scope too
 *   getSaleItems()           the invoice modal was dead for both scoped roles,
 *                            and so was cancelSale(), which calls it
 *   listDueSales(),
 *   listCustomersWithDue(),
 *   productSalesReport()     found by the audit this script came out of; not
 *                            yet reachable from a screen, which is exactly why
 *                            nobody had noticed
 *
 * Every one of them was invisible during development, because `npm run
 * dev:reset` leaves the emulator on the DEV rules, which are wide open. The
 * class of bug only exists under the real ones. So this runs under the real
 * ones, and refuses to run under anything else.
 *
 * ── What makes it trustworthy ────────────────────────────────────────────
 *
 * It calls the REAL functions. scripts/seed.mjs cannot import src/services and
 * maintains document shapes by hand, which is a reasonable trade for a seed and
 * would be a bad one here: a hand-written copy of a query would keep passing
 * after the service function drifted, and a check that looks complete and is
 * not is worse than no check. scripts/cra-esm-hooks.mjs makes the CRA tree
 * importable from Node so this file can call listSales() itself.
 *
 * It also fails when a NEW read is added and not listed here — see COVERAGE
 * below. Adding a list function to src/services/index.js and forgetting this
 * file is the way the next instance would get in.
 *
 * ── What it does NOT cover ───────────────────────────────────────────────
 * Stated at the end of every run, and in docs/SCREEN-AUDIT.md. Read it before
 * treating a green run as proof of anything wider.
 */

import { register } from 'node:module';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { STAFF, OFFICERS, DEMO_PASSWORD } from './seed-data.mjs';

process.env.REACT_APP_USE_EMULATOR = 'true';

register(new URL('./cra-esm-hooks.mjs', import.meta.url).href);
const S = await import(new URL('../src/services/index.js', import.meta.url).href);
const { auth } = await import(new URL('../src/firebase.js', import.meta.url).href);

// ── The accounts ─────────────────────────────────────────────────────────
// Every seeded role that has a login. `Delivery Man` and `Dealer` are in ROLE
// but have no account and no grant in firestore.rules, so there is nothing to
// sign in as — that gap is reported at the end rather than passed over.

const ACCOUNTS = [
    ...STAFF.map(u => ({ email: u.email, role: u.role })),
    { email: OFFICERS[0].email, role: 'Sales Officer' },
];

const ADMIN = ['Super Admin', 'Managing Director'];
const ROW_SCOPED = [...ADMIN, 'Area Manager', 'Sales Officer', 'Accountant'];
const EVERYONE = [...ROW_SCOPED, 'Storekeeper'];

// ── The reads, and who may make them ─────────────────────────────────────
//
// `allow` is transcribed from firestore.rules, one entry per read exported from
// src/services/index.js. `ctx` carries whatever the previous reads produced for
// this role, so a read that needs a document id uses one the role can actually
// see rather than a hardcoded one that only a Super Admin could reach.
//
// A read that needs a row and has none is reported SKIPPED, not PASSED. A skip
// that is silently counted as a pass is the failure mode this whole file exists
// to avoid.

const READS = [
    // ── products · licences — allow read: if active() ────────────────────
    { name: 'listProducts', collection: 'products', allow: EVERYONE, run: () => S.listProducts() },
    { name: 'productOptions', collection: 'products', allow: EVERYONE, run: () => S.productOptions() },
    { name: 'listBannedProducts', collection: 'products', allow: EVERYONE, run: () => S.listBannedProducts() },
    { name: 'listLicences', collection: 'licences', allow: EVERYONE, run: () => S.listLicences({ scope: 'dealer' }) },
    { name: 'getDealerLicences', collection: 'licences', allow: EVERYONE, run: () => S.getDealerLicences('AIC-000001') },
    { name: 'listExpiring', collection: 'licences', allow: EVERYONE, run: () => S.listExpiring() },
    { name: 'expirySummary', collection: 'licences', allow: EVERYONE, run: () => S.expirySummary() },

    // ── customers — row-scoped by myArea()/mine() ────────────────────────
    {
        name: 'listCustomers', collection: 'customers', allow: ROW_SCOPED,
        run: async (ctx) => { ctx.customers = await S.listCustomers(); return ctx.customers; },
    },
    { name: 'customerOptions', collection: 'customers', allow: ROW_SCOPED, run: () => S.customerOptions() },
    { name: 'listCustomersWithDue', collection: 'customers', allow: ROW_SCOPED, run: () => S.listCustomersWithDue() },

    // ── sales · sale_items — row-scoped by myArea()/mine() ───────────────
    {
        name: 'listSales', collection: 'sales', allow: ROW_SCOPED,
        run: async (ctx) => { ctx.sales = await S.listSales({ limit: 500 }); return ctx.sales; },
    },
    { name: 'listCancelledSales', collection: 'sales', allow: ROW_SCOPED, run: () => S.listCancelledSales() },
    { name: 'listDueSales', collection: 'sales', allow: ROW_SCOPED, run: () => S.listDueSales() },
    { name: 'statusCounts', collection: 'sales', allow: ROW_SCOPED, run: () => S.statusCounts() },
    { name: 'salesGroupedBy', collection: 'sales', allow: ROW_SCOPED, run: () => S.salesGroupedBy('officerId') },
    {
        name: 'getSaleItems', collection: 'sale_items', allow: ROW_SCOPED,
        needs: 'sales',
        run: (ctx) => S.getSaleItems(ctx.sales[0].invoiceNo),
    },
    {
        name: 'getSaleWithItems', collection: 'sales + sale_items', allow: ROW_SCOPED,
        needs: 'sales',
        run: (ctx) => S.getSaleWithItems(ctx.sales[0].invoiceNo),
    },
    { name: 'productSalesReport', collection: 'sale_items', allow: ROW_SCOPED, run: () => S.productSalesReport() },

    // ── stock_movements — isAdmin() plus four named roles ────────────────
    { name: 'stockReport', collection: 'stock_movements', allow: EVERYONE, run: () => S.stockReport() },
    { name: 'centralStockReport', collection: 'stock_movements', allow: EVERYONE, run: () => S.centralStockReport() },
    { name: 'lowStock', collection: 'stock_movements', allow: EVERYONE, run: () => S.lowStock() },
    { name: 'listMovements', collection: 'stock_movements', allow: EVERYONE, run: () => S.listMovements({ productId: 'AI-000730' }) },
    { name: 'getStockBalance', collection: 'stock_movements', allow: EVERYONE, run: () => S.getStockBalance('AI-000730', 'head') },

    // ── audit_log — isAdmin() || Area Manager || Accountant ──────────────
    { name: 'listAudit', collection: 'audit_log', allow: [...ADMIN, 'Area Manager', 'Accountant'], run: () => S.listAudit({ limit: 5 }) },
    { name: 'listOverrides', collection: 'audit_log', allow: [...ADMIN, 'Area Manager', 'Accountant'], run: () => S.listOverrides(5) },

    // ── users — the one that CANNOT be scoped with a where() clause ──────
    // The rule's third arm is on the document ID (request.auth.uid == uid), and
    // a LIST cannot prove up front that it returns only your own document. The
    // constraint is on the caller; see the comment on listUsers().
    { name: 'listUsers', collection: 'users', allow: [...ADMIN, 'Accountant'], run: () => S.listUsers() },
    { name: 'listOfficers', collection: 'users', allow: [...ADMIN, 'Accountant'], run: () => S.listOfficers() },
    // …and the same rule read the other way. getMyProfile() is a GET on the
    // caller's own document, which is precisely the arm a LIST cannot satisfy,
    // so every signed-in role may make it — including the three refused above.
    // /profile is built on it for that reason.
    { name: 'getMyProfile', collection: 'users', allow: EVERYONE, run: () => S.getMyProfile() },

    // ── Tier 2 — role-gated, none row-scoped (they are company books) ────
    { name: 'listSuppliers', collection: 'suppliers', allow: [...ADMIN, 'Storekeeper'], run: () => S.listSuppliers() },
    { name: 'supplierOptions', collection: 'suppliers', allow: [...ADMIN, 'Storekeeper'], run: () => S.supplierOptions() },
    { name: 'listSuppliersWithPayable', collection: 'suppliers', allow: [...ADMIN, 'Storekeeper'], run: () => S.listSuppliersWithPayable() },
    { name: 'listPurchases', collection: 'purchases', allow: [...ADMIN, 'Storekeeper'], run: () => S.listPurchases() },
    { name: 'getPurchaseItems', collection: 'purchase_items', allow: [...ADMIN, 'Storekeeper'], run: () => S.getPurchaseItems('AINP-none') },
    { name: 'listPurchaseReturns', collection: 'purchase_returns', allow: ADMIN, run: () => S.listPurchaseReturns() },
    { name: 'listBoms', collection: 'boms', allow: [...ADMIN, 'Storekeeper'], run: () => S.listBoms() },
    { name: 'bomOptions', collection: 'boms', allow: [...ADMIN, 'Storekeeper'], run: () => S.bomOptions() },
    { name: 'listRepackings', collection: 'repackings', allow: ADMIN, run: () => S.listRepackings() },
    { name: 'listDemands', collection: 'product_demands', allow: [...ADMIN, 'Storekeeper'], run: () => S.listDemands() },
    { name: 'listExpenseHeads', collection: 'expense_heads', allow: [...ADMIN, 'Accountant'], run: () => S.listExpenseHeads() },
    { name: 'expenseHeadOptions', collection: 'expense_heads', allow: [...ADMIN, 'Accountant'], run: () => S.expenseHeadOptions() },
    { name: 'listExpenses', collection: 'expenses', allow: [...ADMIN, 'Accountant'], run: () => S.listExpenses() },
    { name: 'expenseByHead', collection: 'expenses', allow: [...ADMIN, 'Accountant'], run: () => S.expenseByHead() },
    { name: 'listBankAccounts', collection: 'bank_accounts', allow: ADMIN, run: () => S.listBankAccounts() },
    { name: 'bankAccountOptions', collection: 'bank_accounts', allow: ADMIN, run: () => S.bankAccountOptions() },
    { name: 'listSupplierPayments', collection: 'supplier_payments', allow: ADMIN, run: () => S.listSupplierPayments() },
    { name: 'listOpeningBalances', collection: 'opening_balances', allow: ADMIN, run: () => S.listOpeningBalances() },
    { name: 'listCommissions', collection: 'commissions', allow: ADMIN, run: () => S.listCommissions() },
    { name: 'listOffers', collection: 'offers', allow: ADMIN, run: () => S.listOffers() },

    // ── Composites — several collections behind one call ─────────────────
    // The reason to test these separately: a composite fails on whichever read
    // inside it is narrowest, and that read is often one level below the
    // function a screen calls. overriddenLicenceValue() was fixed twice for
    // exactly that reason — once for `sales`, then again for `sale_items`.
    { name: 'overriddenLicenceValue', collection: 'sales + sale_items', allow: ROW_SCOPED, run: () => S.overriddenLicenceValue() },
    { name: 'complianceReport', collection: 'licences + customers + sales + sale_items', allow: ROW_SCOPED, run: () => S.complianceReport() },
];

// ── Coverage: fail when a new read is added and not listed above ─────────
//
// The heuristic is deliberately crude and deliberately noisy in the safe
// direction: anything exported from src/services/index.js whose name looks like
// a read must appear in READS or in NOT_A_READ. A new listX() that nobody added
// here is precisely how the fifth instance of this bug would arrive.

const LOOKS_LIKE_A_READ = (n) => /^list/.test(n)
    || /Options$/.test(n)
    || /Report$/.test(n)
    || /Summary$/.test(n)
    || /^get[A-Z].*s$/.test(n);

// Exports the heuristic catches that are not a Firestore LIST. Each needs a
// reason, so this cannot quietly become a place to hide a real read.
const NOT_A_READ = {
    getStatus: 'not an export; guard against future renames',
    listDocs: 'core plumbing — every entry in READS goes through it',
    getSaleItems: 'covered in READS',
    getPurchaseItems: 'covered in READS',
    getStockBalance: 'covered in READS',
    getSaleWithItems: 'covered in READS',
    getPurchaseWithItems: 'wraps getPurchaseItems, already covered',
    productSalesReport: 'covered in READS',
    complianceReport: 'covered in READS',
    expirySummary: 'covered in READS',
    listCustomersWithDue: 'covered in READS',
    listSuppliersWithPayable: 'covered in READS',
    commissionFromPercent: 'pure arithmetic, no read',
    officeOptions: 'built from the OFFICE enum in constants.js, no read',
    packNotation: 'pure formatting, no read',
    demandTotals: 'pure arithmetic over rows already read',
    signedDelta: 'pure arithmetic, no read',
    signedQty: 'pure arithmetic, no read',
    safetySnapshot: 'pure projection of a product already read',
    offerQtyLabel: 'pure formatting, no read',
};

// ── Running ──────────────────────────────────────────────────────────────

const C = { ok: '\x1b[32m', bad: '\x1b[31m', dim: '\x1b[90m', warn: '\x1b[33m', off: '\x1b[0m' };
const failures = [];
const skips = [];

/** allowed | denied | error */
async function attempt(read, ctx) {
    try {
        const out = await read.run(ctx);
        const n = Array.isArray(out) ? out.length
            : out instanceof Map ? out.size
                : out && Array.isArray(out.rows) ? out.rows.length
                    : out === null || out === undefined ? 0 : 1;
        return { outcome: 'allowed', n };
    } catch (err) {
        if (err?.code === 'permission-denied') return { outcome: 'denied' };
        return { outcome: 'error', err };
    }
}

/**
 * Set the acting user exactly as AuthContext.remember() does — the WHOLE shaped
 * profile, not just id/name/role. actorScope() reads areaId off the actor, so an
 * actor recorded without one leaves an Area Manager unable to list anything and
 * this script would report a false failure. startSession() is deliberately not
 * used: it sets only { id, name, role } (CLAUDE.md §5) and it writes a login
 * entry into audit_log, which a verification run has no business doing.
 */
async function actAs(email) {
    const cred = await signInWithEmailAndPassword(auth, email, DEMO_PASSWORD);
    const profile = await S.getUser(cred.user.uid);
    if (!profile) throw new Error(`${email} authenticated but has no users/ profile`);
    S.setActor({
        id: cred.user.uid,
        name: profile.name,
        role: profile.role,
        areaId: profile.areaId ?? null,
        territoryId: profile.territoryId ?? null,
    });
    return profile;
}

// ── Preflight: are these actually the real rules? ────────────────────────
// A green run under the dev rules would be the most dangerous output this
// script could produce — every read allowed, every expectation of a denial
// broken, and it would look like a pass if the denials were not asserted. They
// are, so the run would fail anyway; this just says why in one line instead of
// forty.

console.log('\nSigning in as each seeded role and reading under the loaded rules.\n');

await actAs(STAFF.find(u => u.role === 'Storekeeper').email);
const probe = await attempt({ run: () => S.listSales({ limit: 1 }) }, {});
if (probe.outcome !== 'denied') {
    console.error(`${C.bad}The emulator is NOT running the real rules.${C.off}`);
    console.error('  A Storekeeper read `sales`, which firestore.rules refuses that role.');
    console.error('  This is what `npm run dev:reset` leaves loaded, and it is why this');
    console.error('  class of bug is invisible during development.\n');
    console.error('  Fix:  npm run emulator:rules real\n');
    await signOut(auth).catch(() => { });
    process.exit(2);
}

// ── The matrix ───────────────────────────────────────────────────────────

for (const account of ACCOUNTS) {
    const profile = await actAs(account.email);
    const scope = S.actorScope();
    const scopeText = scope.areaId ? `areaId=${scope.areaId}`
        : scope.officerId ? `officerId=${scope.officerId.slice(0, 12)}…`
            : 'unscoped (their read grant does not depend on the row)';

    console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
    console.log(`${profile.role}  ${C.dim}${account.email}${C.off}`);
    console.log(`  ${C.dim}actorScope(): ${scopeText}${C.off}`);

    const ctx = {};
    for (const read of READS) {
        const shouldAllow = read.allow.includes(profile.role);

        if (read.needs && (!ctx[read.needs] || ctx[read.needs].length === 0)) {
            // Reported, never passed. The row it needed was itself refused, or
            // this role simply owns none.
            skips.push(`${profile.role} · ${read.name} — no ${read.needs} row to read`);
            console.log(`  ${C.warn}SKIP${C.off}  ${read.name.padEnd(24)} ${C.dim}no ${read.needs} row available${C.off}`);
            continue;
        }

        const { outcome, n, err } = await attempt(read, ctx);
        const want = shouldAllow ? 'allowed' : 'denied';

        if (outcome === want) {
            const detail = outcome === 'allowed' ? `${n} row${n === 1 ? '' : 's'}` : 'refused, as intended';
            console.log(`  ${C.ok}PASS${C.off}  ${read.name.padEnd(24)} ${C.dim}${detail}${C.off}`);
            continue;
        }

        let why;
        if (outcome === 'denied') {
            why = `REFUSED but this role may read ${read.collection} — the query asks for more than the rule allows`;
        } else if (outcome === 'allowed') {
            why = `ALLOWED but this role has no read on ${read.collection} — the rule is wider than intended, or this table is wrong`;
        } else {
            why = `threw ${err?.code || err?.name || 'an error'}: ${err?.message}`;
        }
        failures.push(`${profile.role} · ${read.name}() · ${read.collection}\n      ${why}`);
        console.log(`  ${C.bad}FAIL${C.off}  ${read.name.padEnd(24)} ${C.bad}${why}${C.off}`);
    }
}

await signOut(auth).catch(() => { });

// ── Coverage ─────────────────────────────────────────────────────────────

const covered = new Set(READS.map(r => r.name));
const uncovered = Object.keys(S)
    .filter(n => typeof S[n] === 'function')
    .filter(LOOKS_LIKE_A_READ)
    .filter(n => !covered.has(n) && !(n in NOT_A_READ));

console.log(`${C.dim}────────────────────────────────────────────────────────────${C.off}`);
console.log(`\nCoverage: ${READS.length} reads × ${ACCOUNTS.length} roles.`);
if (uncovered.length) {
    console.log(`${C.bad}  ${uncovered.length} export(s) look like a read and are in neither READS nor NOT_A_READ:${C.off}`);
    uncovered.forEach(n => console.log(`    ${n}`));
    console.log('  Add each to READS with the roles firestore.rules allows, or to');
    console.log('  NOT_A_READ with the reason it issues no query.');
    failures.push(`${uncovered.length} uncovered read export(s): ${uncovered.join(', ')}`);
}

// ── What this run does NOT prove ─────────────────────────────────────────

console.log(`
${C.warn}This run does not cover:${C.off}
  · WRITES. Every create, update and soft delete, and the batches behind them.
    A batch fails whole, so a write can be refused by a collection the caller
    never sees on screen — the customers/sales case in CLAUDE.md §6. Reads only,
    here.
  · Roles with no seeded account: Delivery Man and Dealer are in ROLE and have
    no login and no grant in firestore.rules, so nothing signs in as them.
  · GET by id, except where a READS entry happens to make one. A GET can name
    resource.data and is the safe case; the LIST is the trap.
  · Composite indexes. The emulator serves any query, so a missing entry in
    firestore.indexes.json passes here and fails in production.
  · Whether a screen CALLS the function correctly. This proves the service layer
    can read; it does not prove a page passed the right arguments, or that the
    page is on that role's permission list.
  · Row correctness. It counts what came back; it does not check that an Area
    Manager got their own area's rows and only those.`);

if (failures.length) {
    console.log(`\n${C.bad}${failures.length} failure(s):${C.off}`);
    failures.forEach(f => console.log(`  · ${f}`));
    console.log('');
    process.exit(1);
}

console.log(`\n${C.ok}All reads behaved as firestore.rules says they should${C.off}`
    + (skips.length ? `, with ${skips.length} skipped for want of a row:` : '.'));
skips.forEach(s => console.log(`  ${C.dim}· ${s}${C.off}`));
console.log('');
process.exit(0);
