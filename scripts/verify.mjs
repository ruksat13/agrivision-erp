#!/usr/bin/env node
/**
 * Read the database back and check that it says what it is supposed to say.
 *
 *   node scripts/verify.mjs --emulator
 *   node scripts/verify.mjs                 # the real project
 *
 * Counts every collection and checks the invariants that matter: totals equal
 * the sum of their lines, stock never went negative, the ledger balances, and
 * the demonstration set-up (expired licences, banned products) is actually
 * present. Exits non-zero if any check fails.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

const EMULATOR = process.argv.includes('--emulator');
const db = getFirestore(initializeApp({ projectId: 'agrivision-erp', apiKey: 'x', appId: 'x' }));
if (EMULATOR) connectFirestoreEmulator(db, '127.0.0.1', 8080);

// The Tier 1 collections the seed writes, and the counts it writes them at.
// Those counts only hold on a FRESHLY seeded database — using the app moves
// them, which is not a failure. Run this straight after `npm run dev:reset`.
const COLLECTIONS = [
    'products', 'customers', 'licences', 'sales', 'sale_items', 'stock_movements',
    'users', 'audit_log', 'counters',
    // Two Tier 2 masters are seeded, because other screens select from them.
    'suppliers', 'expense_heads',
];
const EXPECTED = {
    products: 24, customers: 30, licences: 26, sales: 17, sale_items: 30,
    stock_movements: 99, users: 12, audit_log: 1, counters: 2,
    suppliers: 20, expense_heads: 24,
};

// The rest of Tier 2 is transactional and starts empty, so it is read for the
// invariants below but never counted — a purchase entered by hand is data, not
// a discrepancy.
const TIER2 = ['opening_balances', 'supplier_payments', 'purchases', 'purchase_returns'];

const load = async (name) => (await getDocs(collection(db, name))).docs.map(d => ({ id: d.id, ...d.data() }));
const money = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const day = (ts) => (ts?.toDate ? ts.toDate() : null);

let failures = 0;
const check = (label, ok, detail = '') => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failures++;
};

const data = {};
for (const c of [...COLLECTIONS, ...TIER2]) data[c] = await load(c);

// ── Counts ────────────────────────────────────────────────────────────────
console.log('\nDocument counts');
let total = 0;
for (const c of COLLECTIONS) {
    const n = data[c].length;
    total += n;
    const want = EXPECTED[c];
    console.log(`  ${String(n).padStart(4)}  ${c.padEnd(18)}${want !== undefined ? (n === want ? '(expected)' : `(EXPECTED ${want})`) : ''}`);
    if (want !== undefined && n !== want) failures++;
}
console.log(`  ${String(total).padStart(4)}  TOTAL`);

// ── Invariants ────────────────────────────────────────────────────────────
console.log('\nInvariants');

// 1 — every sale total equals the sum of its lines
const itemsBySale = data.sale_items.reduce((m, it) => {
    (m[it.saleId] = m[it.saleId] || []).push(it);
    return m;
}, {});
const badTotals = data.sales.filter(s => {
    const lines = itemsBySale[s.invoiceNo] || [];
    return money(lines.reduce((t, l) => t + Number(l.lineTotal), 0)) !== money(s.subTotal);
});
check('sale.subTotal equals the sum of its sale_items', badTotals.length === 0,
    badTotals.length ? badTotals.map(s => s.invoiceNo).join(', ') : `${data.sales.length} invoices`);

// 2 — every sale line resolves to a real product, every sale to a real dealer
const productIds = new Set(data.products.map(p => p.id));
const customerIds = new Set(data.customers.map(c => c.id));
check('every sale_item references a seeded product',
    data.sale_items.every(i => productIds.has(i.productId)));
check('every sale references a seeded dealer',
    data.sales.every(s => customerIds.has(s.customerId)));

// 3 — stock never went negative anywhere
const balances = {};
data.stock_movements.forEach(m => {
    const k = `${m.productId}|${m.officeId}`;
    balances[k] = (balances[k] || 0) + Number(m.qty);
});
const negative = Object.entries(balances).filter(([, v]) => v < 0);
check('no product/office holds negative stock', negative.length === 0,
    negative.length ? negative.slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ') : `${Object.keys(balances).length} product/office pairs`);

// 4 — sale movements are negative, opening movements positive
check('sale movements carry a negative qty',
    data.stock_movements.filter(m => m.type === 'sale').every(m => Number(m.qty) < 0));
check('opening movements carry a positive qty',
    data.stock_movements.filter(m => m.type === 'opening').every(m => Number(m.qty) > 0));

// 5 — cancelled invoices moved no stock and carry a reason
const cancelled = data.sales.filter(s => s.status === 'Cancelled');
const cancelledRefs = new Set(cancelled.map(s => s.invoiceNo));
check('cancelled invoices produced no stock movement',
    data.stock_movements.filter(m => cancelledRefs.has(m.refId)).length === 0,
    `${cancelled.length} cancelled`);
check('every cancelled invoice carries a reason',
    cancelled.every(s => s.cancelReason && s.cancelReason.length > 0));

// 6 — dealer balance equals opening + dues on live invoices + posted entries
//
// `opening_balances` was added when the Customer/Supplier Opening Balance
// screens were wired (SCREEN-AUDIT.md §2.1). Posting an entry moves the party's
// balance, so an invariant that only knows about sale dues reports a false
// failure the first time anyone uses those screens. The sign convention is the
// one BALANCE_SIGN holds in src/services/constants.js, repeated here rather
// than imported because this script does not load the app.
const BALANCE_SIGN = {
    customer: { Debit: +1, Credit: -1 },
    supplier: { Debit: -1, Credit: +1 },
};
const postedFor = (party, partyId) => data.opening_balances
    .filter(e => e.party === party && e.partyId === partyId && e.status === 'Approved')
    .reduce((sum, e) => sum + BALANCE_SIGN[party][e.type] * Number(e.amount || 0), 0);

const dueByCustomer = {};
data.sales.filter(s => s.status !== 'Cancelled').forEach(s => {
    dueByCustomer[s.customerId] = money((dueByCustomer[s.customerId] || 0) + Number(s.dueAmount));
});
const badBalance = data.customers.filter(c =>
    money(Number(c.openingBalance) + (dueByCustomer[c.id] || 0) + postedFor('customer', c.id)) !== money(c.balance));
check('dealer balance equals opening balance plus live dues and posted entries', badBalance.length === 0,
    badBalance.length ? badBalance.slice(0, 3).map(c => c.id).join(', ') : `${data.customers.length} dealers`);

// 6b — the same for suppliers, whose balance is a payable rather than a
// receivable: opening, plus purchases received, less approved payments and
// approved returns.
if (data.suppliers.length) {
    const sumBy = (rows, id, field) => rows
        .filter(r => r.supplierId === id)
        .reduce((s, r) => s + Number(r[field] || 0), 0);

    const badPayable = data.suppliers.filter(s => {
        const purchased = sumBy(data.purchases.filter(p => p.status !== 'Cancelled'), s.id, 'grandTotal');
        const paid = sumBy(data.supplier_payments.filter(p => p.status === 'Approved'), s.id, 'amount');
        const returned = sumBy(data.purchase_returns.filter(r => r.status === 'Approved'), s.id, 'amount');
        const expected = money(Number(s.openingBalance) + postedFor('supplier', s.id) + purchased - paid - returned);
        return expected !== money(s.balance);
    });
    check('supplier payable equals opening plus purchases less payments and returns',
        badPayable.length === 0,
        badPayable.length ? badPayable.slice(0, 3).map(s => s.id).join(', ') : `${data.suppliers.length} suppliers`);
}

// 7 — every product carries the category Feature 1 gates on
check('every product has a category', data.products.every(p => !!p.category));

// ── The demonstration set-up ──────────────────────────────────────────────
console.log('\nDemonstration set-up');

const now = new Date();
const dealerLicences = data.licences.filter(l => l.scope === 'dealer');
const pesticide = dealerLicences.filter(l => l.licenceType === 'Pesticide');
const days = (l) => Math.floor((day(l.expiryDate) - now) / 86400000);

const expired = pesticide.filter(l => days(l) < 0);
const soon = pesticide.filter(l => days(l) >= 0 && days(l) <= 30);
check('3 dealers hold an EXPIRED pesticide licence', expired.length === 3,
    expired.map(l => `${l.holderId} (${days(l)}d)`).join(', '));
check('2 pesticide licences expire within 30 days', soon.length === 2,
    soon.map(l => `${l.holderId} (+${days(l)}d)`).join(', '));

const first15 = data.customers.map(c => c.id).sort().slice(0, 15);
const withPesticide = new Set(pesticide.map(l => l.holderId));
const without = first15.filter(id => !withPesticide.has(id));
check('at least 1 dealer has no pesticide licence at all', without.length >= 1,
    without.slice(0, 3).join(', '));

const banned = data.products.filter(p => p.bannedFrom);
check('2 products are banned from a stated date', banned.length === 2,
    banned.map(p => `${p.id} from ${day(p.bannedFrom)?.toISOString().slice(0, 10)}`).join(', '));
check('banned products are still Active (selectable, so the block is visible)',
    banned.every(p => p.status === 'Active'));

const company = data.licences.filter(l => l.scope === 'company');
check('3 company licences seeded', company.length === 3,
    company.map(l => l.licenceType).join(', '));

// Feature 3. Two assertions, and the second matters more than the first: safety
// figures that print without saying where they came from are the failure §9 of
// the schema doc exists to prevent, and the panel prints `safetySource`
// verbatim. If a placeholder ever loses its label, this fails loudly here
// rather than quietly on a printed invoice.
const AGRO = ['Pesticide', 'PGR', 'Fertilizer'];
const withSafety = data.products.filter(p => p.whoClass || p.dosageBn || p.firstAidBn);
check('2 products carry safety data, for the Feature 3 panel', withSafety.length === 2,
    withSafety.map(p => `${p.id} (WHO ${p.whoClass})`).join(', '));
check('every product carrying safety data states its source', withSafety.every(p => !!p.safetySource));
check('the seeded safety data is labelled as a PLACEHOLDER',
    withSafety.every(p => /placeholder/i.test(p.safetySource || '')));
check('the two panels differ in hazard class, so the colour coding is visible',
    new Set(withSafety.map(p => p.whoClass)).size === 2,
    withSafety.map(p => p.whoClass).join(' vs '));

// The marker path is the one most lines take, so it is worth asserting that it
// is reached rather than assuming it.
const agroLines = data.sale_items.filter(i => AGRO.includes(i.category));
const marked = agroLines.filter(i => !i.safetySnapshot);
check('most agrochemical sale lines print the "not recorded" marker',
    marked.length > 0 && marked.length < agroLines.length,
    `${marked.length} of ${agroLines.length} lines have no snapshot`);
check('a sale line snapshot matches the product it was taken from',
    agroLines.filter(i => i.safetySnapshot).every(i => {
        const p = data.products.find(x => x.id === i.productId);
        return p && i.safetySnapshot.whoClass === p.whoClass;
    }));

// ── Result ────────────────────────────────────────────────────────────────
console.log(failures === 0
    ? `\nAll checks passed. ${total} documents.\n`
    : `\n${failures} CHECK(S) FAILED.\n`);
process.exit(failures ? 1 : 0);
