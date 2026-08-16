// suppliers — schema §10
//
// The mirror of customers.js, and deliberately close enough to it that the two
// read as one pattern. The one place they differ is the meaning of `balance`:
//
//   customers.balance  a RECEIVABLE — what the dealer owes us
//   suppliers.balance  a PAYABLE    — what we owe the supplier
//
// Both go up when the debt grows. Getting that backwards is the mistake this
// file exists to make hard, which is why nothing writes `balance` directly and
// `adjustSupplierBalance()` takes an already-signed delta.
//
// SCREEN-AUDIT.md §2.1.1 puts this before the three group B screens: opening
// balances, payments and commissions all need somewhere to point.

import { doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, toNumber, money, queueAudit, nextSequence,
} from './core';

const NULLABLE_DEFAULTS = {
    contactPerson: null,
    email: null,
    area: null,
    address: null,
};

// ── Reads ─────────────────────────────────────────────────────────────────

export const getSupplier = (code) => getById(COL.SUPPLIERS, code);
export const getSupplierOrThrow = (code) => getByIdOrThrow(COL.SUPPLIERS, code);

/** listSuppliers({ area, status, search }) — `search` covers name, code and phone. */
export async function listSuppliers({ area, status = 'Active', search } = {}) {
    const rows = await listDocs(COL.SUPPLIERS, {
        filters: [['area', '==', area], ['status', '==', status]],
        order: ['name', 'asc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(s =>
        s.name.toLowerCase().includes(k) ||
        s.code.toLowerCase().includes(k) ||
        (s.phone || '').includes(search));
}

export async function supplierOptions(filter = {}) {
    const rows = await listSuppliers(filter);
    return rows.map(s => ({ value: s.code, label: `${s.name} [${s.code}]`, supplier: s }));
}

/** Suppliers we still owe, largest first. */
export const listSuppliersWithPayable = () =>
    listDocs(COL.SUPPLIERS, { filters: [['balance', '>', 0]], order: ['balance', 'desc'] });

/** The next supplier code, e.g. AIS-000089. */
export const nextSupplierCode = async () => `AIS-${await nextSequence('suppliers', { padTo: 6 })}`;

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createSupplier({ code, name, phone, address, area, email, openingBalance })
 * The code becomes the document ID; it is generated when not supplied.
 */
export async function createSupplier(input) {
    requireFields(input, ['name', 'phone'], 'createSupplier');

    const opening = money(toNumber(input.openingBalance ?? 0, 'openingBalance'));
    const code = input.code || await nextSupplierCode();
    const data = {
        ...NULLABLE_DEFAULTS,
        ...input,
        code,
        openingBalance: opening,
        balance: opening,
        status: input.status ?? 'Active',
    };
    assertEnum(data.status, STATUS, 'status');
    return createDoc(COL.SUPPLIERS, data, { id: code });
}

export async function updateSupplier(code, patch) {
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    const clean = { ...patch };
    // Same rule as customers: the balance is the sum of what has been posted
    // against this supplier. Editing it by hand would make the master and the
    // entries disagree with nothing to say why.
    delete clean.balance;
    delete clean.openingBalance;
    delete clean.code;
    return updateDoc_(COL.SUPPLIERS, code, clean);
}

export const deactivateSupplier = (code, reason) => softDelete(COL.SUPPLIERS, code, { reason });

// ── Balance ───────────────────────────────────────────────────────────────

/**
 * Move a supplier's payable by a signed amount, atomically.
 *   an opening credit balance → adjustSupplierBalance(code, +amount, ...)
 *   a payment made to them    → adjustSupplierBalance(code, -amount, ...)
 *
 * Pass the delta already signed. Callers that start from a Debit/Credit should
 * get the sign from `signedDelta()` in openingBalances.js rather than deciding
 * for themselves.
 */
export async function adjustSupplierBalance(code, delta, { refType, refId, reason = null }) {
    const amount = money(toNumber(delta, 'delta'));
    if (amount === 0) return;

    const batch = writeBatch(db);
    batch.update(doc(db, COL.SUPPLIERS, code), { balance: increment(amount), updatedAt: serverTimestamp() });
    queueAudit(batch, {
        action: 'update',
        collection: COL.SUPPLIERS,
        docId: code,
        after: { balanceDelta: amount, refType, refId },
        reason,
    });
    await batch.commit();
}
