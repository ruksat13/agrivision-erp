// purchases + purchase_items — schema §10
//
// The mirror image of sales.js, and written to look like it on purpose. One
// batch holds the invoice, its lines, the stock movements and the supplier's
// payable, so a purchase can no more exist without its stock effect than a sale
// can.
//
// Two differences from a sale worth naming:
//
//   · Stock goes UP. `purchase` is not in OUTWARD_MOVEMENTS, so buildMovement
//     signs it positive; this file never applies a sign itself.
//   · The banned-product rule applies here too, and is NOT overridable.
//     INTERNAL-PLAN.md §3 asks for the Feature 2 check on the purchase path so
//     that banned stock cannot be received. Refusing a sale of stock you were
//     allowed to buy is a control with a hole in it.

import { doc, collection, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, OFFICE, PURCHASE_STATUS } from './constants';
import {
    updateDoc_, getById, getByIdOrThrow, listDocs, nextSequence, queueAudit,
    requireFields, requireActor, assertEnum, toNumber, toTimestamp, toDate, money,
    stripUndefined, ServiceError,
} from './core';
import { getSupplierOrThrow } from './suppliers';
import { getProductOrThrow, isBannedOn } from './products';
import { buildMovement, queueMovements } from './stock';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getPurchase = (no) => getById(COL.PURCHASES, no);
export const getPurchaseOrThrow = (no) => getByIdOrThrow(COL.PURCHASES, no);

export const getPurchaseItems = (purchaseNo) =>
    listDocs(COL.PURCHASE_ITEMS, { filters: [['purchaseId', '==', purchaseNo]], order: ['lineNo', 'asc'] });

/** The invoice and its lines together — what the detail page needs. */
export async function getPurchaseWithItems(no) {
    const purchase = await getPurchaseOrThrow(no);
    return { ...purchase, items: await getPurchaseItems(no) };
}

/** listPurchases({ supplierId, status, officeId, on, search }) */
export async function listPurchases({ supplierId, status, officeId, on, search } = {}) {
    const rows = await listDocs(COL.PURCHASES, {
        filters: [['supplierId', '==', supplierId], ['status', '==', status], ['officeId', '==', officeId]],
        order: ['purchaseNo', 'desc'],
    });

    return rows.filter(p => {
        if (on) {
            const d = toDate(p.purchaseDate);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (search) {
            const k = search.toLowerCase();
            const hay = `${p.purchaseNo} ${p.invoiceNo || ''} ${p.supplierName || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

/** AINP-2026-08-0000013, mirroring the sale invoice format. */
export async function nextPurchaseNo(onDate) {
    const d = toDate(onDate) ?? new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const period = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    return `AINP-${period}-${await nextSequence(`purchases_${period}`, { padTo: 7 })}`;
}

// ── The Feature 2 check on the purchase path ──────────────────────────────

/**
 * Which of these lines may not be received, as at the purchase date.
 * Shaped like checkSaleRules() output so a screen can render it the same way.
 * Never overridable — see the header.
 */
export function bannedPurchaseChecks(products, purchaseDate) {
    return products
        .filter(p => isBannedOn(p, purchaseDate))
        .map(p => ({
            level: 'block',
            code: 'PRODUCT_BANNED',
            productId: p.code,
            message: `${p.name}: ${p.bannedReason || 'registration withdrawn'}${p.bannedAuthority ? ` — ${p.bannedAuthority}` : ''}`,
            overridable: false,
        }));
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createPurchase(input) — the whole receipt in one batch.
 *
 *   await createPurchase({
 *     supplierId: 'AIS-000002',
 *     officeId:   'head',
 *     purchaseDate: '2026-08-16',
 *     invoiceNo:  '10561',                 // the supplier's number
 *     lines: [{ productId: 'AI-000730', qty: 480, unitPrice: 96 }],
 *   })
 *
 * Returns { ...purchase, items }.
 */
export async function createPurchase(input) {
    const actor = requireActor();
    requireFields(input, ['supplierId', 'officeId', 'purchaseDate'], 'createPurchase');
    assertEnum(input.officeId, OFFICE, 'officeId');

    const lines = (input.lines || []).filter(l => l && l.productId);
    if (!lines.length) throw new ServiceError('VALIDATION', 'A purchase needs at least one line.');

    const supplier = await getSupplierOrThrow(input.supplierId);
    const products = await Promise.all(lines.map(l => getProductOrThrow(l.productId)));

    // Feature 2, on the way in. Not overridable, so it is checked here rather
    // than being passed in as a resolved decision the way a sale's blocks are.
    const blocked = bannedPurchaseChecks(products, input.purchaseDate);
    if (blocked.length) {
        throw new ServiceError(
            'VALIDATION',
            `Purchase refused — ${blocked.length === 1 ? 'this product is' : 'these products are'} withdrawn from sale: ${blocked.map(b => b.message).join(' · ')}`,
            { ruleChecks: blocked },
        );
    }

    const purchaseDate = toTimestamp(input.purchaseDate);
    const purchaseNo = input.purchaseNo || await nextPurchaseNo(input.purchaseDate);

    const items = lines.map((line, i) => {
        const product = products[i];
        const qty = toNumber(line.qty, 'qty');
        const unitPrice = money(toNumber(line.unitPrice ?? product.buyPrice ?? 0, 'unitPrice'));
        if (qty <= 0) throw new ServiceError('VALIDATION', `Quantity for ${product.name} must be greater than zero.`);

        return stripUndefined({
            purchaseId: purchaseNo,
            purchaseNo,
            lineNo: i + 1,
            productId: product.code ?? product.id,
            productCode: product.code ?? product.id,
            productName: product.name,        // historical — never refreshed
            category: product.category,
            unitId: product.unitId,
            packSize: product.packSize,
            cartonQty: toNumber(product.cartonQty ?? 1),
            qty,
            unitPrice,
            lineTotal: money(qty * unitPrice),
            purchaseDate,
            supplierId: supplier.code,
            // Reserved for Feature 4, which was cut (INTERNAL-PLAN.md §6)
            lotNo: null,
            mfgDate: null,
            expiryDate: null,
        });
    });

    const subTotal = money(items.reduce((s, it) => s + it.lineTotal, 0));
    const shipping = money(toNumber(input.shipping ?? 0, 'shipping'));
    const additional = money(toNumber(input.additional ?? 0, 'additional'));
    const discount = money(toNumber(input.discount ?? 0, 'discount'));
    const grandTotal = money(subTotal + shipping + additional - discount);

    const purchase = stripUndefined({
        purchaseNo,
        supplierId: supplier.code,
        supplierCode: supplier.code,
        supplierName: supplier.name,          // historical — never refreshed
        invoiceNo: input.invoiceNo?.trim() || null,
        purchaseDate,
        dueDate: toTimestamp(input.dueDate),
        officeId: input.officeId,
        subTotal, shipping, additional, discount, grandTotal,
        status: input.status ?? 'Stock Done',
        note: input.note?.trim() || null,
        ruleChecks: [],
        createdBy: actor.id,
        createdByName: actor.name ?? null,
    });
    assertEnum(purchase.status, PURCHASE_STATUS, 'status');

    // One batch: purchase + lines + stock + payable + audit.
    const batch = writeBatch(db);

    batch.set(doc(db, COL.PURCHASES, purchaseNo), { ...purchase, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    items.forEach(it => batch.set(doc(collection(db, COL.PURCHASE_ITEMS)), { ...it, createdAt: serverTimestamp() }));

    queueMovements(batch, items.map((it, i) => buildMovement({
        product: products[i],
        officeId: input.officeId,
        type: 'purchase',                 // inward — buildMovement signs it positive
        qty: it.qty,
        refType: COL.PURCHASES,
        refId: purchaseNo,
        unitCost: it.unitPrice,
        movedAt: input.purchaseDate,
    })));

    // Buying raises what we owe.
    if (grandTotal !== 0) {
        batch.update(doc(db, COL.SUPPLIERS, supplier.code), {
            balance: increment(grandTotal),
            updatedAt: serverTimestamp(),
        });
    }

    queueAudit(batch, { action: 'create', collection: COL.PURCHASES, docId: purchaseNo, after: purchase });
    await batch.commit();

    return { ...purchase, items };
}

/**
 * Cancelling takes the stock back out and reverses the payable, in one batch.
 * The invoice stays, with a reason — the same treatment cancelSale() gives.
 */
export async function cancelPurchase(purchaseNo, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling a purchase needs a reason.');
    const purchase = await getPurchaseOrThrow(purchaseNo);
    if (purchase.status === 'Cancelled') throw new ServiceError('CONFLICT', 'That purchase is already cancelled.');

    const items = await getPurchaseItems(purchaseNo);
    const products = await Promise.all(items.map(it => getProductOrThrow(it.productId)));

    const batch = writeBatch(db);

    batch.update(doc(db, COL.PURCHASES, purchaseNo), {
        status: 'Cancelled', cancelReason: reason,
        cancelledAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    // The reversal is a purchase_return movement rather than a negative
    // purchase: the ledger should say what happened, not net to zero.
    queueMovements(batch, items.map((it, i) => buildMovement({
        product: products[i],
        officeId: purchase.officeId,
        type: 'purchase_return',
        qty: it.qty,
        refType: COL.PURCHASES,
        refId: purchaseNo,
        unitCost: it.unitPrice,
        movedAt: new Date(),
    })));

    batch.update(doc(db, COL.SUPPLIERS, purchase.supplierId), {
        balance: increment(-money(toNumber(purchase.grandTotal))),
        updatedAt: serverTimestamp(),
    });

    queueAudit(batch, {
        action: 'delete', collection: COL.PURCHASES, docId: purchaseNo,
        before: purchase, after: { status: 'Cancelled' }, reason,
    });
    await batch.commit();

    return { ...purchase, status: 'Cancelled' };
}

export const updatePurchaseNote = (purchaseNo, note) =>
    updateDoc_(COL.PURCHASES, purchaseNo, { note: note?.trim() || null });
