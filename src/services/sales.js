// sales + sale_items — schema §4.4 and §4.5
//
// createSale() is the centre of this layer. One batch writes the sale, its
// lines, the stock movements that follow from it, the dealer's balance and the
// audit entry — so a sale can never exist without its stock effect, and an
// override can never exist without its log entry.

import { doc, collection, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, SALE_STATUS, SALE_FLOW, PAYMENT_TYPE, SALE_SOURCE, OFFICE } from './constants';
import {
    getById, getByIdOrThrow, listDocs, updateDoc_, requireFields, assertEnum, requireActor,
    actorScope, toNumber, toTimestamp, toDate, money, queueAudit, nextSequence,
    stripUndefined, ServiceError,
} from './core';
import { getProductOrThrow, safetySnapshot } from './products';
import { getCustomerOrThrow } from './customers';
import { buildMovement, queueMovements } from './stock';

// ── Invoice numbering ─────────────────────────────────────────────────────

/** AINV-YYYY-MM-NNNNNNN, from an atomic counter so two officers cannot collide. */
export async function nextInvoiceNo(when = new Date()) {
    const d = toDate(when) ?? new Date();
    const seq = await nextSequence('sales');
    return `AINV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${seq}`;
}

// ── Reads ─────────────────────────────────────────────────────────────────

export const getSale = (invoiceNo) => getById(COL.SALES, invoiceNo);
export const getSaleOrThrow = (invoiceNo) => getByIdOrThrow(COL.SALES, invoiceNo);

/**
 * The lines of one invoice, in entry order.
 *
 * The caller's scope goes on this query, and without it the invoice modal was
 * dead for both scoped roles — found by wiring the Dashboard's Latest Orders
 * "View" button, which lands here: "Could not load AINV-2026-07-0034303
 * (permission-denied)" for the Sales Officer who raised that very invoice.
 *
 * `sale_items` is row-scoped by myArea()/mine() exactly as `sales` is, and
 * carries its own denormalised officerId and areaId precisely so that it can be
 * (schema D2). Filtering by saleId alone is therefore an unscoped LIST and is
 * refused outright — even though every line it would return belongs to a sale
 * the caller has already been allowed to read. Rules are not filters
 * (CLAUDE.md §5). This is the same one-level-deeper failure recorded in
 * overriddenLicenceValue() in licences.js, in the same collection.
 *
 * `lineNo` is sorted in memory rather than in the query: two equality filters
 * are served by Firestore's automatic single-field indexes, whereas adding an
 * orderBy would need a composite index per role shape. An invoice has a handful
 * of lines, so the sort is free.
 */
export async function getSaleItems(invoiceNo) {
    const scope = actorScope();
    const rows = await listDocs(COL.SALE_ITEMS, {
        filters: [
            ['saleId', '==', invoiceNo],
            ['areaId', '==', scope.areaId],
            ['officerId', '==', scope.officerId],
        ],
    });
    return rows.sort((a, b) => toNumber(a.lineNo) - toNumber(b.lineNo));
}

/** Everything the invoice modal needs, in one call. */
export async function getSaleWithItems(invoiceNo) {
    const [sale, items] = await Promise.all([getSaleOrThrow(invoiceNo), getSaleItems(invoiceNo)]);
    return { ...sale, items };
}

/**
 * listSales({ status, customerId, officerId, areaId, from, to, limit })
 *
 * The caller's own scope is applied automatically, for the reason
 * listCustomers() does it: leaving it to each caller did not work. Sales.js and
 * Dashboard.js remembered to spread actorScope(); statusCounts(),
 * salesGroupedBy() and listCancelledSales() did not, so all three asked for
 * every invoice in the company and would have been refused outright for an Area
 * Manager or a Sales Officer. Rules are not filters (CLAUDE.md §5) — Firestore
 * denies the LIST rather than narrowing it.
 *
 * An explicit argument still wins, so an admin can narrow to one area and the
 * reports keep working. Passing one that contradicts the caller's own scope
 * does not widen anything: the rules refuse it, exactly as they should.
 *
 * Both shapes are indexed — the (officerId, saleDate) and (areaId, saleDate)
 * entries in firestore.indexes.json exist for these queries.
 */
export async function listSales({ status, customerId, officerId, areaId, from, to, limit = 100 } = {}) {
    const scope = actorScope();
    const filters = [
        ['status', '==', status],
        ['customerId', '==', customerId],
        ['officerId', '==', officerId ?? scope.officerId],
        ['areaId', '==', areaId ?? scope.areaId],
    ];
    if (from) filters.push(['saleDate', '>=', toTimestamp(from)]);
    if (to) filters.push(['saleDate', '<=', toTimestamp(to)]);

    const rows = await listDocs(COL.SALES, { filters, order: ['saleDate', 'desc'], limit });
    return rows.map(r => ({ ...r, saleDate: toDate(r.saleDate) }));
}

/** Cancelled invoices — what the Cancel Sales screen reads (decision D3). */
export const listCancelledSales = (opts = {}) => listSales({ ...opts, status: 'Cancelled' });

/**
 * Invoices still carrying a receivable — the Due report.
 *
 * Scoped, like every other read of this collection. It was not, and the only
 * menu that reaches /due-invoices is 'all', so nothing was failing — but an
 * unscoped read of a row-scoped collection is a landmine rather than a
 * decision, and the audit that followed getSaleItems() found three of them
 * sitting behind screens nobody had opened under the real rules yet.
 *
 * The inequality needs the equality beside it in a composite index; both
 * (officerId, dueAmount) and (areaId, dueAmount) are declared in
 * firestore.indexes.json for exactly this query.
 */
export async function listDueSales({ limit = 200 } = {}) {
    const scope = actorScope();
    const rows = await listDocs(COL.SALES, {
        filters: [
            ['officerId', '==', scope.officerId],
            ['areaId', '==', scope.areaId],
            ['dueAmount', '>', 0],
        ],
        order: ['dueAmount', 'desc'],
        limit,
    });
    return rows.map(r => ({ ...r, saleDate: toDate(r.saleDate) }));
}

/** Counts per status, for the eight tabs on the Sales screen. */
export async function statusCounts(scope = {}) {
    const rows = await listSales({ ...scope, limit: 1000 });
    return rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
}

// ── Creating a sale ───────────────────────────────────────────────────────

/**
 * createSale(input) — the whole transaction in one batch.
 *
 *   await createSale({
 *     customerId: 'AIC-000791',
 *     officeId:   'head',
 *     saleDate:   '2026-08-13',
 *     paymentType:'Credit',
 *     lines: [{ productId: 'AI-000730', qty: 48, unitPrice: 102 }],
 *     ruleChecks: rules,          // whatever checkSaleRules() returned
 *   })
 *
 * Throws if any ruleCheck is a block that was not overridden — the rule engine
 * decides, this function only refuses to persist a decision that was ignored.
 * Returns { ...sale, items }.
 */
export async function createSale(input) {
    const actor = requireActor();
    requireFields(input, ['customerId', 'officeId', 'saleDate', 'paymentType'], 'createSale');
    assertEnum(input.paymentType, PAYMENT_TYPE, 'paymentType');
    assertEnum(input.officeId, OFFICE, 'officeId');
    if (input.source) assertEnum(input.source, SALE_SOURCE, 'source');

    const lines = input.lines || [];
    if (lines.length === 0) throw new ServiceError('VALIDATION', 'A sale needs at least one line.');

    // A block that nobody overrode must not reach the database.
    const ruleChecks = input.ruleChecks || [];
    const unresolved = ruleChecks.filter(r => r.level === 'block' && !r.overridden);
    if (unresolved.length) {
        throw new ServiceError(
            'VALIDATION',
            `Sale refused: ${unresolved.map(r => r.message).join(' ')}`,
            { ruleChecks: unresolved },
        );
    }
    ruleChecks.filter(r => r.overridden).forEach(r => {
        if (!r.overrideReason) {
            throw new ServiceError('VALIDATION', `Override of ${r.code} needs a written reason.`);
        }
    });

    // Load the documents we denormalise from.
    const customer = await getCustomerOrThrow(input.customerId);
    const products = await Promise.all(lines.map(l => getProductOrThrow(l.productId)));

    const saleDate = toTimestamp(input.saleDate);
    const invoiceNo = input.invoiceNo || await nextInvoiceNo(input.saleDate);

    // Lines
    const items = lines.map((line, i) => {
        const product = products[i];
        const qty = toNumber(line.qty, 'qty');
        const unitPrice = money(toNumber(line.unitPrice ?? product.mrp, 'unitPrice'));
        const lineDiscount = money(toNumber(line.discount ?? 0, 'line discount'));
        if (qty <= 0) throw new ServiceError('VALIDATION', `Quantity for ${product.name} must be greater than zero.`);

        return stripUndefined({
            saleId: invoiceNo,
            invoiceNo,
            lineNo: i + 1,
            productId: product.code ?? product.id,
            productName: product.name,      // historical — never refreshed
            productCode: product.code ?? product.id,
            category: product.category,
            unitId: product.unitId,
            packSize: product.packSize,
            qty,
            cartonQty: toNumber(product.cartonQty ?? 1),
            unitPrice,
            discount: lineDiscount,
            lineTotal: money(qty * unitPrice - lineDiscount),
            saleDate,
            officerId: input.officerId ?? actor.id,
            territoryId: customer.territoryId,
            areaId: customer.areaId,
            safetySnapshot: safetySnapshot(product),   // null when nothing recorded
        });
    });

    // Totals
    const subTotal = money(items.reduce((s, it) => s + it.lineTotal, 0));
    const discount = money(toNumber(input.discount ?? 0, 'discount'));
    const shipping = money(toNumber(input.shipping ?? 0, 'shipping'));
    const vat = money(toNumber(input.vat ?? 0, 'vat'));
    const grandTotal = money(subTotal - discount + shipping + vat);
    const paidAmount = money(toNumber(input.paidAmount ?? (input.paymentType === 'Cash' ? grandTotal : 0), 'paidAmount'));
    const dueAmount = money(grandTotal - paidAmount);

    const sale = stripUndefined({
        invoiceNo,
        customerId: customer.code ?? customer.id,
        customerName: customer.name,          // historical — never refreshed
        customerPhone: customer.phone,
        customerAddress: customer.address,
        officerId: input.officerId ?? actor.id,
        officerName: input.officerName ?? actor.name ?? null,
        territoryId: customer.territoryId,
        areaId: customer.areaId,
        officeId: input.officeId,
        saleDate,
        dueDate: toTimestamp(input.dueDate),
        paymentType: input.paymentType,
        subTotal, discount, shipping, vat, grandTotal, paidAmount, dueAmount,
        status: input.status ?? 'Pending',
        source: input.source ?? 'Admin',
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        ruleChecks,
        createdBy: actor.id,
    });
    assertEnum(sale.status, SALE_STATUS, 'status');

    // One batch: sale + lines + stock + balance + audit.
    // 1 sale + n lines + n movements + 1 customer + 1 audit ≤ 500 for any
    // realistic order, so no chunking is needed.
    const batch = writeBatch(db);

    batch.set(doc(db, COL.SALES, invoiceNo), { ...sale, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    items.forEach(it => batch.set(doc(collection(db, COL.SALE_ITEMS)), { ...it, createdAt: serverTimestamp() }));

    queueMovements(batch, items.map((it, i) => buildMovement({
        product: products[i],
        officeId: input.officeId,
        type: 'sale',
        qty: it.qty,                     // buildMovement applies the negative sign
        refType: COL.SALES,
        refId: invoiceNo,
        unitCost: products[i].buyPrice,
        movedAt: input.saleDate,
    })));

    if (dueAmount !== 0) {
        batch.update(doc(db, COL.CUSTOMERS, sale.customerId), {
            balance: increment(dueAmount),
            updatedAt: serverTimestamp(),
        });
    }

    queueAudit(batch, { action: 'create', collection: COL.SALES, docId: invoiceNo, after: sale });

    // An override is logged as its own entry as well as living on the sale, so
    // "show me the overrides" is one query on audit_log.
    ruleChecks.filter(r => r.overridden).forEach(r => {
        queueAudit(batch, {
            action: 'rule_override',
            collection: COL.SALES,
            docId: invoiceNo,
            after: { code: r.code, productId: r.productId ?? null, message: r.message },
            reason: r.overrideReason,
        });
    });

    await batch.commit();
    return { ...sale, items };
}

// ── Status workflow ───────────────────────────────────────────────────────

/** The next status in the workflow, or null at the end. */
export function nextStatus(current) {
    const i = SALE_FLOW.indexOf(current);
    return i >= 0 && i < SALE_FLOW.length - 1 ? SALE_FLOW[i + 1] : null;
}

export async function updateSaleStatus(invoiceNo, status, { reason = null } = {}) {
    assertEnum(status, SALE_STATUS, 'status');
    if (status === 'Cancelled') {
        throw new ServiceError('VALIDATION', 'Use cancelSale() — a cancellation must record who and why.');
    }
    const before = await getSaleOrThrow(invoiceNo);
    if (before.status === 'Cancelled') {
        throw new ServiceError('CONFLICT', `${invoiceNo} is cancelled and cannot change status.`);
    }
    return updateDoc_(COL.SALES, invoiceNo, { status }, { reason });
}

export async function advanceSale(invoiceNo) {
    const sale = await getSaleOrThrow(invoiceNo);
    const next = nextStatus(sale.status);
    if (!next) throw new ServiceError('CONFLICT', `${invoiceNo} is already ${sale.status}.`);
    return updateSaleStatus(invoiceNo, next);
}

/**
 * Cancel an invoice: reverses stock, reverses the dealer's balance and records
 * who cancelled it and why — all in one batch.
 *
 * The sale is not deleted; the Cancel Sales screen reads status === 'Cancelled'
 * (decision D3).
 */
export async function cancelSale(invoiceNo, reason) {
    const actor = requireActor();
    if (!reason || !reason.trim()) {
        throw new ServiceError('VALIDATION', 'A cancellation must carry a reason.');
    }

    const sale = await getSaleOrThrow(invoiceNo);
    if (sale.status === 'Cancelled') throw new ServiceError('CONFLICT', `${invoiceNo} is already cancelled.`);
    const items = await getSaleItems(invoiceNo);

    const batch = writeBatch(db);

    batch.update(doc(db, COL.SALES, invoiceNo), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: actor.id,
        cancelReason: reason.trim(),
        updatedAt: serverTimestamp(),
    });

    // Put the stock back, as a sale_return movement rather than by deleting the
    // original — the ledger is append-only (schema §7).
    queueMovements(batch, items.map(it => buildMovement({
        product: { code: it.productId, name: it.productName },
        officeId: sale.officeId,
        type: 'sale_return',
        qty: it.qty,
        refType: COL.SALES,
        refId: invoiceNo,
        movedAt: new Date(),
    })));

    if (toNumber(sale.dueAmount) !== 0) {
        batch.update(doc(db, COL.CUSTOMERS, sale.customerId), {
            balance: increment(-toNumber(sale.dueAmount)),
            updatedAt: serverTimestamp(),
        });
    }

    queueAudit(batch, {
        action: 'update',
        collection: COL.SALES,
        docId: invoiceNo,
        before: { status: sale.status },
        after: { status: 'Cancelled' },
        reason: reason.trim(),
    });

    await batch.commit();
    return { ...sale, status: 'Cancelled', cancelReason: reason.trim() };
}

/** Record a payment against an invoice. */
export async function recordPayment(invoiceNo, amount, { reason = null } = {}) {
    const paid = money(toNumber(amount, 'amount'));
    const sale = await getSaleOrThrow(invoiceNo);
    const newPaid = money(toNumber(sale.paidAmount) + paid);
    const newDue = money(toNumber(sale.grandTotal) - newPaid);
    if (newDue < 0) throw new ServiceError('VALIDATION', `Payment exceeds the outstanding amount on ${invoiceNo}.`);

    const batch = writeBatch(db);
    batch.update(doc(db, COL.SALES, invoiceNo), { paidAmount: newPaid, dueAmount: newDue, updatedAt: serverTimestamp() });
    batch.update(doc(db, COL.CUSTOMERS, sale.customerId), { balance: increment(-paid), updatedAt: serverTimestamp() });
    queueAudit(batch, {
        action: 'update',
        collection: COL.SALES,
        docId: invoiceNo,
        before: { paidAmount: sale.paidAmount, dueAmount: sale.dueAmount },
        after: { paidAmount: newPaid, dueAmount: newDue },
        reason,
    });
    await batch.commit();

    return { ...sale, paidAmount: newPaid, dueAmount: newDue };
}

// ── Reports (the ones kept — schema §8) ───────────────────────────────────

/**
 * Products Sales: quantity and value per product over a date range.
 *
 * `sale_items` is row-scoped by myArea()/mine() exactly as `sales` is, so the
 * caller's scope goes on this query too. It filtered on territoryId and
 * officerId only, which meant an Area Manager — whose grant is on `areaId` —
 * was refused the LIST outright. Nothing had noticed because Reports.js is
 * still a sample-data screen and no page calls this yet; it would have failed
 * the first time one did, which is the same way getSaleItems() surfaced.
 */
export async function productSalesReport({ from, to, territoryId, officerId } = {}) {
    const scope = actorScope();
    const filters = [
        ['territoryId', '==', territoryId],
        ['officerId', '==', officerId ?? scope.officerId],
        ['areaId', '==', scope.areaId],
    ];
    if (from) filters.push(['saleDate', '>=', toTimestamp(from)]);
    if (to) filters.push(['saleDate', '<=', toTimestamp(to)]);

    const rows = await listDocs(COL.SALE_ITEMS, { filters });
    const byProduct = new Map();
    rows.forEach(it => {
        const cur = byProduct.get(it.productId) || {
            productId: it.productId, productName: it.productName,
            productCode: it.productCode, category: it.category, qty: 0, amount: 0, lines: 0,
        };
        cur.qty += toNumber(it.qty);
        cur.amount = money(cur.amount + toNumber(it.lineTotal));
        cur.lines += 1;
        byProduct.set(it.productId, cur);
    });
    return [...byProduct.values()].sort((a, b) => b.amount - a.amount);
}

/** Group sales by any denormalised field: 'officerId', 'customerId', 'territoryId', 'areaId'. */
export async function salesGroupedBy(field, { from, to } = {}) {
    const rows = await listSales({ from, to, limit: 1000 });
    const live = rows.filter(r => r.status !== 'Cancelled');
    const groups = new Map();
    live.forEach(s => {
        const key = s[field];
        const cur = groups.get(key) || { key, invoices: 0, amount: 0, paid: 0, due: 0 };
        cur.invoices += 1;
        cur.amount = money(cur.amount + toNumber(s.grandTotal));
        cur.paid = money(cur.paid + toNumber(s.paidAmount));
        cur.due = money(cur.due + toNumber(s.dueAmount));
        groups.set(key, cur);
    });
    return [...groups.values()].sort((a, b) => b.amount - a.amount);
}
