#!/usr/bin/env node
/**
 * Seed the Firestore database with the sample data already present in the pages.
 *
 *   node scripts/seed.mjs             # write to the real project
 *   node scripts/seed.mjs --emulator  # write to the local emulator instead
 *   node scripts/seed.mjs --wipe      # clear the seeded collections first
 *   node scripts/seed.mjs --dry       # print what would be written, write nothing
 *
 * Start the emulator first with:  npm run emulators
 *
 * Run it once, before the screens are wired up. It is safe to re-run with
 * --wipe; without --wipe it will refuse to overwrite an existing sale.
 *
 * Deliberately self-contained: it talks to Firestore directly rather than
 * importing src/services, because those files are ES modules inside a
 * Create React App tree that Node cannot import without a build step. The
 * document shapes below follow docs/FIRESTORE-SCHEMA.md — if you change a
 * shape there, change it here too.
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore, collection, doc, getDocs, writeBatch,
    connectFirestoreEmulator, Timestamp, serverTimestamp,
} from 'firebase/firestore';

import {
    PRODUCTS, PRODUCT_BY_NAME, OFFICERS, STAFF, DEALERS, INVOICES,
    COMPANY_LICENCES, dealerLicences, openingStock, OFFICES,
    SUPPLIERS, SUPPLIER_COUNTER, EXPENSE_HEADS,
} from './seed-data.mjs';

// ── Config ────────────────────────────────────────────────────────────────
// Same values as src/firebase.js. The web config is public by design; security
// comes from Firestore Rules.
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCWAPj11h5NFw4xOuULvqR8F0WzJCrmecY',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'agrivision-erp.firebaseapp.com',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'agrivision-erp',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'agrivision-erp.firebasestorage.app',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '877686770216',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:877686770216:web:2dafa5745f2927a302431d',
};

const args = process.argv.slice(2);
const WIPE = args.includes('--wipe');
const DRY = args.includes('--dry');
const EMULATOR = args.includes('--emulator') || process.env.FIRESTORE_EMULATOR === '1';

const db = getFirestore(initializeApp(firebaseConfig));
if (EMULATOR) {
    // Port matches firebase.json. The emulator ignores Security Rules by
    // default, so seeding needs no rules change.
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// Tier 1, plus the two Tier 2 masters that other screens select from. The rest
// of Tier 2 is transactional and starts empty — an empty purchase register is
// an empty register, but an empty supplier list is a broken dropdown.
const COLLECTIONS = [
    'products', 'customers', 'licences', 'sales', 'sale_items', 'stock_movements',
    'users', 'audit_log', 'counters',
    'suppliers', 'expense_heads',
];

// ── Helpers ───────────────────────────────────────────────────────────────

const ts = (v) => (v ? Timestamp.fromDate(new Date(v)) : null);
const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const SEED_ACTOR = { id: 'system-seed', name: 'Seed script', role: 'Super Admin' };

/** Queued writes, flushed in chunks of 400 (Firestore's limit is 500). */
const queue = [];
const put = (col, id, data) => queue.push({ col, id, data });

async function flush() {
    if (DRY) {
        const byCol = queue.reduce((m, q) => ({ ...m, [q.col]: (m[q.col] || 0) + 1 }), {});
        console.log('\n--dry: nothing written. Would have written:');
        Object.entries(byCol).forEach(([c, n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));
        return;
    }
    for (let i = 0; i < queue.length; i += 400) {
        const chunk = queue.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach(({ col, id, data }) => {
            const ref = id ? doc(db, col, id) : doc(collection(db, col));
            batch.set(ref, data);
        });
        await batch.commit();
        process.stdout.write(`  committed ${Math.min(i + 400, queue.length)}/${queue.length}\r`);
    }
    console.log(`  committed ${queue.length}/${queue.length}      `);
}

async function wipe() {
    console.log('Wiping seeded collections…');
    for (const col of COLLECTIONS) {
        const snap = await getDocs(collection(db, col));
        if (snap.empty) { console.log(`  ${col}: empty`); continue; }
        for (let i = 0; i < snap.docs.length; i += 400) {
            const batch = writeBatch(db);
            snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        console.log(`  ${col}: deleted ${snap.docs.length}`);
    }
}

async function assertEmpty() {
    const snap = await getDocs(collection(db, 'sales'));
    if (!snap.empty) {
        console.error(`\nRefusing to seed: 'sales' already has ${snap.docs.length} document(s).`);
        console.error("Re-run with --wipe to clear the seeded collections first.\n");
        process.exit(1);
    }
}

// ── Build ─────────────────────────────────────────────────────────────────

function seedProducts() {
    PRODUCTS.forEach(p => {
        put('products', p.code, {
            name: p.name,
            code: p.code,
            category: p.category,
            brandId: p.brandId ?? null,
            originId: p.originId ?? null,
            unitId: p.unitId,
            packSize: p.packSize,
            packQty: p.packQty ?? 1,
            type: p.type,
            cartonQty: p.cartonQty ?? 1,
            mrp: money(p.mrp),
            buyPrice: p.buyPrice == null ? null : money(p.buyPrice),
            status: 'Active',
            // Feature 2
            bannedFrom: ts(p.bannedFrom),
            bannedReason: p.bannedReason ?? null,
            bannedAuthority: p.bannedAuthority ?? null,
            // Feature 3 — null on purpose; see the note in seed-data.mjs
            whoClass: null,
            signalWordBn: null,
            phiDays: null,
            reentryHours: null,
            firstAidBn: null,
            dosageBn: null,
            approvedCropsBn: null,
            // Feature 4 — reserved
            requiresExpiry: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    return PRODUCTS.length;
}

function seedUsers() {
    OFFICERS.forEach(o => {
        put('users', o.code, {
            name: o.name,
            email: o.email,
            role: 'Sales Officer',
            permissions: ['/', '/sales', '/customer', '/customer-ledger', '/sales-report', '/stock-report'],
            officeId: 'head',
            areaId: o.areaId,
            territoryId: o.territoryId,
            employeeId: null,
            customerId: null,
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    STAFF.forEach(s => {
        put('users', s.code, {
            name: s.name,
            email: s.email,
            role: s.role,
            permissions: s.permissions,
            officeId: 'head',
            areaId: s.areaId ?? null,
            territoryId: null,
            employeeId: null,
            customerId: null,
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    return OFFICERS.length + STAFF.length;
}

/** Dealers, with balances that already include the dues from the seeded sales. */
function seedCustomers(dueByCustomer) {
    DEALERS.forEach((d, i) => {
        const officer = OFFICERS[i % OFFICERS.length];
        const opening = money(d.openingBalance);
        put('customers', d.code, {
            name: d.name,
            code: d.code,
            phone: d.phone,
            contactPerson: null,
            email: null,
            address: d.address,
            territoryId: d.territoryId,
            areaId: d.areaId,
            officerId: officer.code,
            openingBalance: opening,
            balance: money(opening + (dueByCustomer[d.code] || 0)),
            // A spread of limits, so the credit-limit rule has something to bite on
            creditLimit: [0, 200000, 500000, 1000000][i % 4],
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    return DEALERS.length;
}

function seedLicences() {
    COMPANY_LICENCES.forEach(l => {
        put('licences', null, {
            scope: 'company',
            holderId: null,
            holderName: 'Agrivision International',
            licenceType: l.licenceType,
            licenceNo: l.licenceNo,
            issuingAuthority: l.issuingAuthority,
            issueDate: ts(l.issueDate),
            expiryDate: ts(l.expiryDate),
            documentUrl: null,
            note: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });

    const dealer = dealerLicences(DEALERS);
    dealer.forEach(l => {
        put('licences', null, {
            ...l,
            issueDate: ts(l.issueDate),
            expiryDate: ts(l.expiryDate),
            documentUrl: null,
            note: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    return COMPANY_LICENCES.length + dealer.length;
}

function seedOpeningStock() {
    const rows = openingStock(PRODUCTS);
    rows.forEach(r => {
        put('stock_movements', null, {
            productId: r.product.code,
            productCode: r.product.code,
            productName: r.product.name,
            officeId: r.officeId,
            type: 'opening',
            qty: r.qty,                       // opening is inward, so positive
            unitCost: money(r.unitCost),
            refType: 'opening',
            refId: `OPEN-${r.officeId}`,
            movedAt: ts('2026-01-01'),
            createdBy: SEED_ACTOR.id,
            lotNo: null, mfgDate: null, expiryDate: null,
            createdAt: serverTimestamp(),
        });
    });
    return rows.length;
}

/** Sales, their lines and the stock movements that follow from them. */
function seedSales() {
    const dueByCustomer = {};
    let items = 0;
    let movements = 0;

    INVOICES.forEach(inv => {
        const officer = OFFICERS.find(o => o.code === inv.officer);
        const dealer = DEALERS.find(d => d.code === inv.customerId);
        if (!dealer) throw new Error(`Invoice ${inv.no} references unknown dealer ${inv.customerId}`);

        const lines = inv.items.map(([name, qty, unitPrice], i) => {
            const code = PRODUCT_BY_NAME[name];
            if (!code) throw new Error(`Invoice ${inv.no}: no product matches "${name}"`);
            const product = PRODUCTS.find(p => p.code === code);
            return {
                lineNo: i + 1,
                product,
                qty,
                unitPrice: money(unitPrice),
                lineTotal: money(qty * unitPrice),
            };
        });

        const subTotal = money(lines.reduce((s, l) => s + l.lineTotal, 0));
        const grandTotal = subTotal;
        const paidAmount = inv.pay === 'Cash' ? grandTotal : 0;
        const dueAmount = money(grandTotal - paidAmount);
        const cancelled = inv.status === 'Cancelled';

        if (!cancelled && dueAmount) {
            dueByCustomer[dealer.code] = money((dueByCustomer[dealer.code] || 0) + dueAmount);
        }

        put('sales', inv.no, {
            invoiceNo: inv.no,
            customerId: dealer.code,
            customerName: dealer.name,
            customerPhone: dealer.phone,
            customerAddress: dealer.address,
            officerId: officer.code,
            officerName: officer.name,
            territoryId: dealer.territoryId,
            areaId: dealer.areaId,
            officeId: 'head',
            saleDate: ts(inv.date),
            dueDate: ts(inv.due),
            paymentType: inv.pay,
            subTotal,
            discount: 0,
            shipping: 0,
            vat: 0,
            grandTotal,
            paidAmount,
            dueAmount: cancelled ? 0 : dueAmount,
            status: inv.status,
            source: 'App',
            cancelledAt: cancelled ? ts(inv.date) : null,
            cancelledBy: cancelled ? SEED_ACTOR.id : null,
            cancelReason: inv.cancelReason ?? null,
            ruleChecks: [],
            createdBy: SEED_ACTOR.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        lines.forEach(l => {
            put('sale_items', null, {
                saleId: inv.no,
                invoiceNo: inv.no,
                lineNo: l.lineNo,
                productId: l.product.code,
                productName: l.product.name,
                productCode: l.product.code,
                category: l.product.category,
                unitId: l.product.unitId,
                packSize: l.product.packSize,
                qty: l.qty,
                cartonQty: l.product.cartonQty ?? 1,
                unitPrice: l.unitPrice,
                discount: 0,
                lineTotal: l.lineTotal,
                saleDate: ts(inv.date),
                officerId: officer.code,
                territoryId: dealer.territoryId,
                areaId: dealer.areaId,
                safetySnapshot: null,        // no safety data seeded — see seed-data.mjs
                createdAt: serverTimestamp(),
            });
            items += 1;

            // A cancelled invoice never moved stock, so it gets no movement.
            if (!cancelled) {
                put('stock_movements', null, {
                    productId: l.product.code,
                    productCode: l.product.code,
                    productName: l.product.name,
                    officeId: 'head',
                    type: 'sale',
                    qty: -l.qty,                    // outward movements are negative
                    unitCost: l.product.buyPrice ?? null,
                    refType: 'sales',
                    refId: inv.no,
                    movedAt: ts(inv.date),
                    createdBy: SEED_ACTOR.id,
                    lotNo: null, mfgDate: null, expiryDate: null,
                    createdAt: serverTimestamp(),
                });
                movements += 1;
            }
        });
    });

    return { sales: INVOICES.length, items, movements, dueByCustomer };
}

// ══ Tier 2 masters ═══════════════════════════════════════════════════════
// Only the two that other screens SELECT from. Purchases, returns, repacking
// runs, expenses and commissions are transactional and start empty on purpose.

function seedSuppliers() {
    SUPPLIERS.forEach(s => {
        const opening = money(s.openingBalance);
        put('suppliers', s.code, {
            name: s.name,
            code: s.code,
            phone: s.phone,
            contactPerson: s.contactPerson,
            email: s.email,
            area: s.area,
            address: s.address,
            openingBalance: opening,
            // A payable, not a receivable. Nothing has been purchased or paid
            // against these yet, so the balance IS the opening figure.
            balance: opening,
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    return SUPPLIERS.length;
}

function seedExpenseHeads() {
    EXPENSE_HEADS.forEach(name => {
        put('expense_heads', null, {
            name,
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    return EXPENSE_HEADS.length;
}

function seedCounter() {
    // Highest seeded invoice is …0034675, so the next generated one continues
    // the series rather than colliding with it.
    put('counters', 'sales', { value: 34675, updatedAt: serverTimestamp() });
    // Same for supplier codes: the next createSupplier() must not reissue a
    // code the seed already used.
    put('counters', 'suppliers', { value: SUPPLIER_COUNTER, updatedAt: serverTimestamp() });
}

function seedAuditEntry(counts) {
    put('audit_log', null, {
        at: serverTimestamp(),
        userId: SEED_ACTOR.id,
        userName: SEED_ACTOR.name,
        userRole: SEED_ACTOR.role,
        action: 'seed',
        collection: '*',
        docId: 'seed-run',
        before: null,
        after: counts,
        reason: 'Initial seed from the sample data in the pages',
        userAgent: `node ${process.version}`,
    });
}

// ── Run ───────────────────────────────────────────────────────────────────

async function main() {
    const target = EMULATOR ? 'EMULATOR at 127.0.0.1:8080' : `project "${firebaseConfig.projectId}"`;
    console.log(`\nAgriVision seed → ${target}${DRY ? '  (dry run)' : ''}\n`);

    if (WIPE && !DRY) await wipe();
    else if (!DRY) await assertEmpty();

    // Sales are built first because dealer balances depend on their dues.
    const sales = seedSales();

    const counts = {
        products: seedProducts(),
        users: seedUsers(),
        customers: seedCustomers(sales.dueByCustomer),
        licences: seedLicences(),
        openingStockMovements: seedOpeningStock(),
        sales: sales.sales,
        saleItems: sales.items,
        saleMovements: sales.movements,
        suppliers: seedSuppliers(),
        expenseHeads: seedExpenseHeads(),
    };
    seedCounter();
    seedAuditEntry(counts);

    console.log('Writing…');
    await flush();

    if (DRY) return;

    console.log('\nSeeded:');
    Object.entries(counts).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

    console.log(`
Ready to demonstrate:
  · ${OFFICES.length} offices, opening stock in each
  · 3 dealers with an EXPIRED pesticide licence, 2 expiring within a month,
    1 with none at all  → Feature 1
  · 2 products banned from a stated date         → Feature 2
  · ${sales.sales} invoices, ${sales.items} lines, 2 of them cancelled with a reason
  · ${SUPPLIERS.length} suppliers and ${EXPENSE_HEADS.length} expense heads, so no dropdown on the
    supplier, purchase or expense screens opens empty

Two things still need you:

  1. SAFETY DATA IS EMPTY on every product. That is deliberate — inventing
     pre-harvest intervals or first-aid text would put unverifiable safety
     claims in front of an examiner. Photograph five product labels and fill in
     SAFETY_TEMPLATE in scripts/seed-data.mjs. Until then the invoice prints
     its "safety data not recorded" marker, which is Feature 3's own third
     requirement, so nothing is broken.

  2. bannedAuthority on AI-000905 and AI-000906 is a PLACEHOLDER. Replace it
     with a real DAE notification reference before submission.

  Users are seeded with placeholder IDs (AIO-…/AIU-…). Step 5 of the migration
  order in docs/FIRESTORE-SCHEMA.md replaces them with Firebase Auth UIDs.
`);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\nSeed failed:', err.message);
        if (err.code === 'permission-denied') {
            console.error('Firestore rules are rejecting the write. Step 1 of the migration order\nexpects development rules while seeding.');
        }
        process.exit(1);
    });
