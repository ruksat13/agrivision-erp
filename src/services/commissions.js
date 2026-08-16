// commissions — schema §10
//
// One collection for the customer and the supplier commission screens,
// separated by `party` — the same reasoning as `opening_balances`.
//
// Both screens showed the commission type as a pair of badges: Yearly+Amount,
// Purchase+Percentage, Product+Amount. That was one `types[]` array holding two
// independent choices, which made "every percentage-based commission" an
// array-contains query that could not tell the two dimensions apart. They are
// two fields here: `basis` (what the commission is for) and `method` (how it
// was worked out).
//
// A commission does NOT move the party's balance. It is a record of what was
// awarded; paying it is a supplier payment or a collection, which has its own
// document. Keeping the two apart is what stops one commission being paid
// twice without leaving a trace.

import { COL, PARTY, COMMISSION_BASIS, COMMISSION_METHOD, COMMISSION_STATUS } from './constants';
import {
    createDoc, updateDoc_, getById, getByIdOrThrow, listDocs, nextSequence,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money, ServiceError,
} from './core';
import { getCustomerOrThrow } from './customers';
import { getSupplierOrThrow } from './suppliers';
import { getProduct } from './products';

const loadParty = (party, id) => (party === 'customer' ? getCustomerOrThrow(id) : getSupplierOrThrow(id));

/** AISC-008113 for a supplier, AICC-000001 for a customer. */
export const nextCommissionCode = async (party) => {
    const prefix = party === 'customer' ? 'AICC' : 'AISC';
    return `${prefix}-${await nextSequence(`commissions_${party}`, { padTo: 6 })}`;
};

// ── Reads ─────────────────────────────────────────────────────────────────

export const getCommission = (code) => getById(COL.COMMISSIONS, code);
export const getCommissionOrThrow = (code) => getByIdOrThrow(COL.COMMISSIONS, code);

/** listCommissions({ party, partyId, basis, method, status, on, ref, search }) */
export async function listCommissions({ party, partyId, basis, method, status, on, ref, search } = {}) {
    const rows = await listDocs(COL.COMMISSIONS, {
        filters: [
            ['party', '==', party],
            ['partyId', '==', partyId],
            ['basis', '==', basis],
            ['method', '==', method],
            ['status', '==', status],
        ],
        order: ['code', 'desc'],
    });

    return rows.filter(c => {
        if (on) {
            const d = toDate(c.date);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (ref && !(c.refs || []).some(r => r.toLowerCase().includes(ref.toLowerCase()))) return false;
        if (search) {
            const k = search.toLowerCase();
            const hay = `${c.partyName || ''} ${c.partyCode || ''} ${c.code} ${c.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

/**
 * What a percentage-based commission comes to. Returned rather than stored so
 * the screen can show it before saving; `amount` is what is actually written,
 * because a rounded figure that was agreed is not always the computed one.
 */
export const commissionFromPercent = (baseAmount, percent) =>
    money(toNumber(baseAmount, 'baseAmount') * toNumber(percent, 'percent') / 100);

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createCommission({ party, partyId, basis, method, amount, date,
 *                    percent, baseAmount, productId, refs, note })
 */
export async function createCommission(input) {
    requireFields(input, ['party', 'partyId', 'basis', 'method', 'amount', 'date'], 'createCommission');
    assertEnum(input.party, PARTY, 'party');
    assertEnum(input.basis, COMMISSION_BASIS, 'basis');
    assertEnum(input.method, COMMISSION_METHOD, 'method');

    const amount = money(toNumber(input.amount, 'amount'));
    if (amount <= 0) throw new ServiceError('VALIDATION', 'A commission must be more than zero.');

    if (input.method === 'Percentage' && !input.percent) {
        throw new ServiceError('VALIDATION', 'A percentage commission needs the percentage.');
    }
    if (input.basis === 'Product' && !input.productId) {
        throw new ServiceError('VALIDATION', 'A product commission needs the product.');
    }

    const partyDoc = await loadParty(input.party, input.partyId);
    const product = input.productId ? await getProduct(input.productId) : null;

    const code = input.code || await nextCommissionCode(input.party);
    const data = {
        code,
        party: input.party,
        partyId: input.partyId,
        partyName: partyDoc.name,
        partyCode: partyDoc.code,
        basis: input.basis,
        method: input.method,
        percent: input.percent == null || input.percent === '' ? null : toNumber(input.percent, 'percent'),
        baseAmount: input.baseAmount == null || input.baseAmount === '' ? null : money(toNumber(input.baseAmount, 'baseAmount')),
        productId: product?.code ?? null,
        productName: product?.name ?? null,
        // Purchase and invoice numbers the commission was worked out from.
        // Strings until `purchases` exists — see §10.
        refs: (input.refs || []).map(r => String(r).trim()).filter(Boolean),
        amount,
        date: toTimestamp(input.date),
        status: input.status ?? 'Pending',
        note: input.note?.trim() || null,
    };
    assertEnum(data.status, COMMISSION_STATUS, 'status');

    return createDoc(COL.COMMISSIONS, data, { id: code });
}

export async function approveCommission(code) {
    const before = await getCommissionOrThrow(code);
    if (before.status !== 'Pending') throw new ServiceError('CONFLICT', `Commission is already ${before.status}.`);
    return updateDoc_(COL.COMMISSIONS, code, { status: 'Approved' }, { action: 'approve' });
}

export async function cancelCommission(code, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling a commission needs a reason.');
    const before = await getCommissionOrThrow(code);
    if (before.status === 'Cancelled') throw new ServiceError('CONFLICT', 'That commission is already cancelled.');
    return updateDoc_(COL.COMMISSIONS, code, { status: 'Cancelled' }, { reason, action: 'delete' });
}
