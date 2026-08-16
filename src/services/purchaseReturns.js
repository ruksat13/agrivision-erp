// purchase_returns — schema §10
//
// Goods going back to a supplier. Approval is what moves anything: the stock
// leaves and the payable drops together, on approve, because until somebody
// says the goods actually went back neither has happened.
//
// Lines are embedded rather than a `purchase_return_items` collection. A return
// is small, is read whole, and nothing queries across the lines of every return
// — the test D2 applies to `sale_items` and this fails it.

import { doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, OFFICE, RETURN_STATUS } from './constants';
import {
    getById, getByIdOrThrow, listDocs, nextSequence, queueAudit,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money,
    stripUndefined, ServiceError,
} from './core';
import { getSupplierOrThrow } from './suppliers';
import { getProductOrThrow } from './products';
import { getPurchase } from './purchases';
import { buildMovement, queueMovements, getStockBalance } from './stock';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getPurchaseReturn = (id) => getById(COL.PURCHASE_RETURNS, id);
export const getPurchaseReturnOrThrow = (id) => getByIdOrThrow(COL.PURCHASE_RETURNS, id);

/** listPurchaseReturns({ supplierId, status, on, search }) */
export async function listPurchaseReturns({ supplierId, status, on, search } = {}) {
    const rows = await listDocs(COL.PURCHASE_RETURNS, {
        filters: [['supplierId', '==', supplierId], ['status', '==', status]],
        order: ['returnNo', 'desc'],
    });

    return rows.filter(r => {
        if (on) {
            const d = toDate(r.returnDate);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (search) {
            const k = search.toLowerCase();
            const hay = `${r.returnNo} ${r.purchaseNo || ''} ${r.supplierName || ''} ${r.reason || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

export const nextReturnNo = async () => `AIPRT-${await nextSequence('purchase_returns', { padTo: 6 })}`;

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createPurchaseReturn({ supplierId, officeId, returnDate, reason,
 *                        purchaseNo, items: [{ productId, qty, unitPrice }] })
 *
 * Saved as Pending. Nothing moves until approvePurchaseReturn().
 */
export async function createPurchaseReturn(input) {
    requireFields(input, ['supplierId', 'officeId', 'returnDate', 'reason'], 'createPurchaseReturn');
    assertEnum(input.officeId, OFFICE, 'officeId');

    const lines = (input.items || []).filter(l => l && l.productId);
    if (!lines.length) throw new ServiceError('VALIDATION', 'A return needs at least one product line.');

    const supplier = await getSupplierOrThrow(input.supplierId);
    // The purchase reference is optional — a return can be raised against
    // stock whose original receipt predates this system.
    const purchase = input.purchaseNo ? await getPurchase(input.purchaseNo) : null;
    if (input.purchaseNo && !purchase) {
        throw new ServiceError('NOT_FOUND', `Purchase ${input.purchaseNo} does not exist.`);
    }

    const items = [];
    for (const line of lines) {
        const product = await getProductOrThrow(line.productId);
        const qty = toNumber(line.qty, 'qty');
        if (qty <= 0) throw new ServiceError('VALIDATION', `Quantity for ${product.name} must be greater than zero.`);
        const unitPrice = money(toNumber(line.unitPrice ?? product.buyPrice ?? 0, 'unitPrice'));
        items.push({
            productId: product.code,
            productName: product.name,
            packSize: product.packSize ?? null,
            cartonQty: toNumber(product.cartonQty ?? 1),
            qty,
            unitPrice,
            lineTotal: money(qty * unitPrice),
        });
    }

    const amount = money(items.reduce((s, it) => s + it.lineTotal, 0));
    const returnNo = input.returnNo || await nextReturnNo();

    const data = stripUndefined({
        returnNo,
        purchaseId: purchase?.purchaseNo ?? null,
        purchaseNo: purchase?.purchaseNo ?? null,
        supplierId: supplier.code,
        supplierName: supplier.name,
        officeId: input.officeId,
        returnDate: toTimestamp(input.returnDate),
        items,
        amount,
        reason: String(input.reason).trim(),
        status: 'Pending',
        note: input.note?.trim() || null,
    });
    assertEnum(data.status, RETURN_STATUS, 'status');

    const ref = doc(db, COL.PURCHASE_RETURNS, returnNo);
    const batch = writeBatch(db);
    batch.set(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    queueAudit(batch, { action: 'create', collection: COL.PURCHASE_RETURNS, docId: returnNo, after: data });
    await batch.commit();

    return { id: returnNo, ...data };
}

/**
 * Approve: the stock leaves and the payable drops, in one batch.
 *
 * The stock is checked first. Returning more than is held would drive the
 * balance negative, and `verify.mjs` asserts that never happens — better to
 * refuse with a clear message than to break an invariant the seed guarantees.
 */
export async function approvePurchaseReturn(id) {
    const ret = await getPurchaseReturnOrThrow(id);
    if (ret.status !== 'Pending') throw new ServiceError('CONFLICT', `Return is already ${ret.status}.`);

    const products = await Promise.all(ret.items.map(it => getProductOrThrow(it.productId)));

    for (const it of ret.items) {
        const held = await getStockBalance(it.productId, ret.officeId);
        if (toNumber(it.qty) > held) {
            throw new ServiceError(
                'CONFLICT',
                `Cannot return ${it.qty} × ${it.productName} — only ${held} in stock at this office.`,
            );
        }
    }

    const batch = writeBatch(db);

    batch.update(doc(db, COL.PURCHASE_RETURNS, id), {
        status: 'Approved', approvedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    queueMovements(batch, ret.items.map((it, i) => buildMovement({
        product: products[i],
        officeId: ret.officeId,
        type: 'purchase_return',       // outward — buildMovement signs it negative
        qty: it.qty,
        refType: COL.PURCHASE_RETURNS,
        refId: id,
        unitCost: it.unitPrice,
        movedAt: ret.returnDate,
    })));

    const delta = -money(toNumber(ret.amount));
    batch.update(doc(db, COL.SUPPLIERS, ret.supplierId), {
        balance: increment(delta), updatedAt: serverTimestamp(),
    });

    queueAudit(batch, {
        action: 'approve', collection: COL.PURCHASE_RETURNS, docId: id,
        before: ret, after: { status: 'Approved' },
    });
    queueAudit(batch, {
        action: 'update', collection: COL.SUPPLIERS, docId: ret.supplierId,
        after: { balanceDelta: delta, refType: COL.PURCHASE_RETURNS, refId: id },
        reason: `Purchase return approved — ${ret.returnNo}`,
    });
    await batch.commit();

    return { ...ret, status: 'Approved' };
}

/** Cancel. If it had been approved the stock and the payable both go back. */
export async function cancelPurchaseReturn(id, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling a return needs a reason.');
    const ret = await getPurchaseReturnOrThrow(id);
    if (ret.status === 'Cancelled') throw new ServiceError('CONFLICT', 'That return is already cancelled.');

    const wasApproved = ret.status === 'Approved';
    const products = wasApproved
        ? await Promise.all(ret.items.map(it => getProductOrThrow(it.productId)))
        : [];

    const batch = writeBatch(db);
    batch.update(doc(db, COL.PURCHASE_RETURNS, id), {
        status: 'Cancelled', cancelReason: reason,
        cancelledAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    if (wasApproved) {
        queueMovements(batch, ret.items.map((it, i) => buildMovement({
            product: products[i],
            officeId: ret.officeId,
            type: 'purchase',           // the goods come back in
            qty: it.qty,
            refType: COL.PURCHASE_RETURNS,
            refId: id,
            unitCost: it.unitPrice,
            movedAt: new Date(),
        })));
        const delta = money(toNumber(ret.amount));
        batch.update(doc(db, COL.SUPPLIERS, ret.supplierId), {
            balance: increment(delta), updatedAt: serverTimestamp(),
        });
        queueAudit(batch, {
            action: 'update', collection: COL.SUPPLIERS, docId: ret.supplierId,
            after: { balanceDelta: delta, refType: COL.PURCHASE_RETURNS, refId: id },
            reason: `Approved return cancelled — ${reason}`,
        });
    }

    queueAudit(batch, {
        action: 'delete', collection: COL.PURCHASE_RETURNS, docId: id,
        before: ret, after: { status: 'Cancelled' }, reason,
    });
    await batch.commit();

    return { ...ret, status: 'Cancelled' };
}
