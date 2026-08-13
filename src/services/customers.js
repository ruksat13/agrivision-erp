// customers (dealers) — schema §4.2
//
// `balance` is a denormalised running total, adjusted with increment() so two
// concurrent writes cannot lose one another. `areaId` and `officerId` are what
// Security Rules scope Area Managers and Sales Officers on, so both are required.

import { doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, toNumber, money, queueAudit,
} from './core';

const NULLABLE_DEFAULTS = {
    contactPerson: null,
    email: null,
};

// ── Reads ─────────────────────────────────────────────────────────────────

export const getCustomer = (code) => getById(COL.CUSTOMERS, code);
export const getCustomerOrThrow = (code) => getByIdOrThrow(COL.CUSTOMERS, code);

/**
 * listCustomers({ areaId, territoryId, officerId, status, search })
 *
 * Pass the signed-in user's scope so the list matches what Security Rules will
 * allow — an Area Manager should be given `{ areaId: user.areaId }`.
 */
export async function listCustomers({ areaId, territoryId, officerId, status = 'Active', search } = {}) {
    const rows = await listDocs(COL.CUSTOMERS, {
        filters: [
            ['areaId', '==', areaId],
            ['territoryId', '==', territoryId],
            ['officerId', '==', officerId],
            ['status', '==', status],
        ],
        order: ['name', 'asc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(c =>
        c.name.toLowerCase().includes(k) ||
        c.code.toLowerCase().includes(k) ||
        (c.phone || '').includes(search));
}

export async function customerOptions(filter = {}) {
    const rows = await listCustomers(filter);
    return rows.map(c => ({ value: c.code, label: `${c.name} [${c.code}]`, customer: c }));
}

/** Dealers carrying a receivable, largest first — the Due report. */
export const listCustomersWithDue = () =>
    listDocs(COL.CUSTOMERS, { filters: [['balance', '>', 0]], order: ['balance', 'desc'] });

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createCustomer({ code, name, phone, address, territoryId, areaId, officerId,
 *                  openingBalance, creditLimit })
 * The dealer code becomes the document ID.
 */
export async function createCustomer(input) {
    requireFields(input, ['code', 'name', 'phone', 'address', 'territoryId', 'areaId', 'officerId'], 'createCustomer');

    const opening = money(toNumber(input.openingBalance ?? 0, 'openingBalance'));
    const data = {
        ...NULLABLE_DEFAULTS,
        ...input,
        code: input.code,
        openingBalance: opening,
        balance: opening,
        creditLimit: money(toNumber(input.creditLimit ?? 0, 'creditLimit')),
        status: input.status ?? 'Active',
    };
    assertEnum(data.status, STATUS, 'status');
    return createDoc(COL.CUSTOMERS, data, { id: input.code });
}

export async function updateCustomer(code, patch) {
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    const clean = { ...patch };
    if ('creditLimit' in clean) clean.creditLimit = money(toNumber(clean.creditLimit, 'creditLimit'));
    // balance is derived from transactions; changing it by hand would make the
    // ledger and the master disagree with no record of why.
    delete clean.balance;
    delete clean.openingBalance;
    return updateDoc_(COL.CUSTOMERS, code, clean);
}

export const deactivateCustomer = (code, reason) => softDelete(COL.CUSTOMERS, code, { reason });

// ── Balance ───────────────────────────────────────────────────────────────

/**
 * Move a dealer's balance by a signed amount, atomically.
 *   a credit sale        → adjustBalance(code, +dueAmount, ...)
 *   a cash collection    → adjustBalance(code, -amount, ...)
 *
 * Sales call this for you inside their own batch; use it directly only for
 * adjustments that are not a sale.
 */
export async function adjustBalance(code, delta, { refType, refId, reason = null }) {
    const amount = money(toNumber(delta, 'delta'));
    if (amount === 0) return;

    const batch = writeBatch(db);
    batch.update(doc(db, COL.CUSTOMERS, code), { balance: increment(amount), updatedAt: serverTimestamp() });
    queueAudit(batch, {
        action: 'update',
        collection: COL.CUSTOMERS,
        docId: code,
        after: { balanceDelta: amount, refType, refId },
        reason,
    });
    await batch.commit();
}

/**
 * Would this sale take the dealer past their credit limit?
 * Returns null when it would not, or a rule object shaped like every other
 * entry in sales.ruleChecks so checkSaleRules can return it unchanged.
 */
export function creditLimitCheck(customer, addedAmount) {
    const limit = toNumber(customer?.creditLimit ?? 0);
    if (limit <= 0) return null;                       // 0 = no limit
    const after = toNumber(customer?.balance ?? 0) + toNumber(addedAmount);
    if (after <= limit) return null;
    return {
        level: 'block',
        code: 'CREDIT_LIMIT_EXCEEDED',
        productId: null,
        message: `Credit limit ৳${limit.toLocaleString()} exceeded — balance would become ৳${after.toLocaleString()}.`,
        overridable: true,
    };
}
