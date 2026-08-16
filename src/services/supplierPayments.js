// supplier_payments — schema §10
//
// Money going out to a supplier. The payable moves on APPROVAL, not on entry:
// an unapproved payment is somebody's claim that they paid, and posting it
// straight away would understate what is still owed. That is also why the
// screen's approve button was worth keeping rather than saving everything as
// approved.
//
// Deleting is a status change to `Cancelled`, and if the payment had already
// been approved the payable is put back in the same batch.

import { doc, collection, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, PAY_METHOD, PAYMENT_STATUS } from './constants';
import {
    updateDoc_, getById, getByIdOrThrow, listDocs, queueAudit,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money, ServiceError,
} from './core';
import { getSupplierOrThrow } from './suppliers';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getSupplierPayment = (id) => getById(COL.SUPPLIER_PAYMENTS, id);
export const getSupplierPaymentOrThrow = (id) => getByIdOrThrow(COL.SUPPLIER_PAYMENTS, id);

/** listSupplierPayments({ supplierId, status, on, search }) */
export async function listSupplierPayments({ supplierId, status, on, search } = {}) {
    const rows = await listDocs(COL.SUPPLIER_PAYMENTS, {
        filters: [['supplierId', '==', supplierId], ['status', '==', status]],
        order: ['payDate', 'desc'],
    });

    return rows.filter(p => {
        if (on) {
            const d = toDate(p.payDate);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (search) {
            const k = search.toLowerCase();
            const hay = `${p.supplierName || ''} ${p.supplierCode || ''} ${p.note || ''} ${p.txnId || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createSupplierPayment({ supplierId, amount, payMethod, payDate,
 *                         bankAccountId, bankAccountLabel, bankName, txnId, note })
 *
 * Saved as Pending. Nothing moves until approveSupplierPayment().
 */
export async function createSupplierPayment(input) {
    requireFields(input, ['supplierId', 'amount', 'payMethod', 'payDate'], 'createSupplierPayment');
    assertEnum(input.payMethod, PAY_METHOD, 'payMethod');

    const amount = money(toNumber(input.amount, 'amount'));
    if (amount <= 0) throw new ServiceError('VALIDATION', 'A payment must be more than zero.');

    const supplier = await getSupplierOrThrow(input.supplierId);

    const data = {
        supplierId: supplier.code,
        supplierName: supplier.name,
        supplierCode: supplier.code,
        amount,
        payMethod: input.payMethod,
        payDate: toTimestamp(input.payDate),
        bankAccountId: input.bankAccountId || null,
        bankAccountLabel: input.bankAccountLabel || null,
        bankName: input.bankName?.trim() || null,
        txnId: input.txnId?.trim() || null,
        status: 'Pending',
        note: input.note?.trim() || null,
    };

    const ref = doc(collection(db, COL.SUPPLIER_PAYMENTS));
    const batch = writeBatch(db);
    batch.set(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    queueAudit(batch, { action: 'create', collection: COL.SUPPLIER_PAYMENTS, docId: ref.id, after: data });
    await batch.commit();

    return { id: ref.id, ...data };
}

/** Edit a payment. Only allowed while it is still Pending. */
export async function updateSupplierPayment(id, patch) {
    const before = await getSupplierPaymentOrThrow(id);
    if (before.status !== 'Pending') {
        throw new ServiceError('CONFLICT', `Payment is ${before.status} — only a Pending payment can be edited.`);
    }
    const clean = { ...patch };
    if (clean.payMethod) assertEnum(clean.payMethod, PAY_METHOD, 'payMethod');
    if ('amount' in clean) {
        clean.amount = money(toNumber(clean.amount, 'amount'));
        if (clean.amount <= 0) throw new ServiceError('VALIDATION', 'A payment must be more than zero.');
    }
    if ('payDate' in clean) clean.payDate = toTimestamp(clean.payDate);
    // The supplier and the status are not editable here: changing who was paid
    // after the fact is a new payment plus a cancellation, not an edit.
    delete clean.supplierId;
    delete clean.supplierName;
    delete clean.supplierCode;
    delete clean.status;
    return updateDoc_(COL.SUPPLIER_PAYMENTS, id, clean);
}

/** Approve, and reduce the payable in the same batch. */
export async function approveSupplierPayment(id) {
    const payment = await getSupplierPaymentOrThrow(id);
    if (payment.status !== 'Pending') {
        throw new ServiceError('CONFLICT', `Payment is already ${payment.status}.`);
    }
    assertEnum('Approved', PAYMENT_STATUS, 'status');

    const delta = -money(toNumber(payment.amount));

    const batch = writeBatch(db);
    batch.update(doc(db, COL.SUPPLIER_PAYMENTS, id), {
        status: 'Approved', approvedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, COL.SUPPLIERS, payment.supplierId), {
        balance: increment(delta), updatedAt: serverTimestamp(),
    });
    queueAudit(batch, {
        action: 'approve', collection: COL.SUPPLIER_PAYMENTS, docId: id,
        before: payment, after: { status: 'Approved' },
    });
    queueAudit(batch, {
        action: 'update', collection: COL.SUPPLIERS, docId: payment.supplierId,
        after: { balanceDelta: delta, refType: COL.SUPPLIER_PAYMENTS, refId: id },
        reason: `Payment approved — ${payment.amount}`,
    });
    await batch.commit();

    return { ...payment, status: 'Approved' };
}

/**
 * The Delete button. Nothing is hard-deleted; if the payment had been approved
 * the payable is restored in the same batch, so the master can never drift from
 * the payments that produced it.
 */
export async function cancelSupplierPayment(id, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling a payment needs a reason.');
    const payment = await getSupplierPaymentOrThrow(id);
    if (payment.status === 'Cancelled') throw new ServiceError('CONFLICT', 'That payment is already cancelled.');

    const wasApproved = payment.status === 'Approved';
    const delta = wasApproved ? money(toNumber(payment.amount)) : 0;

    const batch = writeBatch(db);
    batch.update(doc(db, COL.SUPPLIER_PAYMENTS, id), {
        status: 'Cancelled', cancelReason: reason, cancelledAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    if (delta) {
        batch.update(doc(db, COL.SUPPLIERS, payment.supplierId), {
            balance: increment(delta), updatedAt: serverTimestamp(),
        });
        queueAudit(batch, {
            action: 'update', collection: COL.SUPPLIERS, docId: payment.supplierId,
            after: { balanceDelta: delta, refType: COL.SUPPLIER_PAYMENTS, refId: id },
            reason: `Approved payment cancelled — ${reason}`,
        });
    }
    queueAudit(batch, {
        action: 'delete', collection: COL.SUPPLIER_PAYMENTS, docId: id,
        before: payment, after: { status: 'Cancelled' }, reason,
    });
    await batch.commit();

    return { ...payment, status: 'Cancelled' };
}
