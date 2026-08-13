// stock_movements — schema §4.6
//
// The only place a stock figure is ever written. No screen sets a stock number;
// it records a movement, and stock is the sum of movements. That is what makes
// selling reduce stock, which SCREEN-AUDIT.md §4.1 records as not happening today.
//
// `qty` is always signed. Callers pass a positive quantity and the direction is
// derived from `type`, so the sign can never be applied twice by mistake.

import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, MOVEMENT_TYPE, OFFICE, OUTWARD_MOVEMENTS } from './constants';
import {
    listDocs, requireFields, assertEnum, toNumber, toTimestamp, toDate,
    queueAudit, stripUndefined, money, requireActor,
} from './core';

/** Movement types that remove stock carry a negative qty. */
export const signedQty = (type, qty) => {
    const n = Math.abs(toNumber(qty, 'qty'));
    return OUTWARD_MOVEMENTS.includes(type) ? -n : n;
};

// ── Building movements ────────────────────────────────────────────────────

/**
 * Build one movement document. Exported because sales.js queues movements onto
 * its own batch — a sale, its lines and its stock effect must commit together
 * or not at all.
 */
export function buildMovement({ product, officeId, type, qty, refType, refId, unitCost = null, movedAt = new Date() }) {
    requireFields({ officeId, type, refType, refId }, ['officeId', 'type', 'refType', 'refId'], 'stock movement');
    assertEnum(type, MOVEMENT_TYPE, 'movement type');
    assertEnum(officeId, OFFICE, 'officeId');
    const actor = requireActor();

    return stripUndefined({
        productId: product.code ?? product.id,
        productCode: product.code ?? product.id,
        productName: product.name,
        officeId,
        type,
        qty: signedQty(type, qty),
        unitCost: unitCost == null ? null : money(toNumber(unitCost, 'unitCost')),
        refType,
        refId,
        movedAt: toTimestamp(movedAt),
        createdBy: actor.id,
        // Feature 4 was cut; the fields are reserved so no migration is needed later
        lotNo: null,
        mfgDate: null,
        expiryDate: null,
    });
}

/** Queue movements onto an existing batch (used by sales.js). */
export function queueMovements(batch, movements) {
    movements.forEach(m => batch.set(doc(collection(db, COL.STOCK_MOVEMENTS)), m));
}

/**
 * Record one movement on its own, with its audit entry.
 * Use this for damage, opening stock and transfers. Sales and purchases record
 * their movements as part of their own batch instead.
 *
 *   await recordMovement({ product, officeId: 'head', type: 'damage',
 *                          qty: 12, refType: 'damages', refId: 'DMG-001' })
 */
export async function recordMovement(input) {
    const movement = buildMovement(input);
    const ref = doc(collection(db, COL.STOCK_MOVEMENTS));

    const batch = writeBatch(db);
    batch.set(ref, { ...movement, createdAt: serverTimestamp() });
    queueAudit(batch, {
        action: 'create',
        collection: COL.STOCK_MOVEMENTS,
        docId: ref.id,
        after: movement,
        reason: input.reason ?? null,
    });
    await batch.commit();

    return { id: ref.id, ...movement };
}

// ── Reads ─────────────────────────────────────────────────────────────────

/** listMovements({ productId, officeId, type, limit }) — newest first. */
export async function listMovements({ productId, officeId, type, limit = 200 } = {}) {
    const rows = await listDocs(COL.STOCK_MOVEMENTS, {
        filters: [['productId', '==', productId], ['officeId', '==', officeId], ['type', '==', type]],
        order: ['movedAt', 'desc'],
        limit,
    });
    return rows.map(r => ({ ...r, movedAt: toDate(r.movedAt) }));
}

/**
 * Current stock for one product, optionally at one office.
 * A plain sum of movements. At the data volume of this submission that is fast
 * enough; schema §4.6 explains what to do if it stops being.
 */
export async function getStockBalance(productId, officeId) {
    const rows = await listDocs(COL.STOCK_MOVEMENTS, {
        filters: [['productId', '==', productId], ['officeId', '==', officeId]],
    });
    return rows.reduce((sum, m) => sum + toNumber(m.qty), 0);
}

/**
 * The Stock Report, computed rather than hardcoded. Returns one row per
 * product with the movement types broken out into columns, matching the
 * columns StockReport.js already renders.
 */
export async function stockReport({ officeId } = {}) {
    const rows = await listDocs(COL.STOCK_MOVEMENTS, { filters: [['officeId', '==', officeId]] });

    const byProduct = new Map();
    rows.forEach(m => {
        const key = m.productId;
        if (!byProduct.has(key)) {
            byProduct.set(key, {
                productId: key,
                productCode: m.productCode,
                productName: m.productName,
                opening: 0, purchase: 0, repacking: 0, raw: 0,
                ret: 0, sell: 0, damage: 0, stock: 0,
            });
        }
        const row = byProduct.get(key);
        const qty = toNumber(m.qty);
        row.stock += qty;

        switch (m.type) {
            case 'opening': row.opening += qty; break;
            case 'purchase': row.purchase += qty; break;
            case 'repack_in': row.repacking += qty; break;
            case 'repack_out': row.raw += Math.abs(qty); break;
            case 'sale': row.sell += Math.abs(qty); break;
            case 'sale_return': row.ret += qty; break;
            case 'damage': row.damage += Math.abs(qty); break;
            default: break;
        }
    });

    return [...byProduct.values()].sort((a, b) => a.productName.localeCompare(b.productName));
}

/**
 * Central Stock: one row per product with a column per office.
 * Replaces the hardcoded groups in CentralStockReport.js.
 */
export async function centralStockReport() {
    const rows = await listDocs(COL.STOCK_MOVEMENTS, {});
    const byProduct = new Map();

    rows.forEach(m => {
        if (!byProduct.has(m.productId)) {
            byProduct.set(m.productId, {
                productId: m.productId,
                productCode: m.productCode,
                productName: m.productName,
                head: 0, jessore: 0, jamalpur: 0, total: 0,
            });
        }
        const row = byProduct.get(m.productId);
        const qty = toNumber(m.qty);
        if (row[m.officeId] !== undefined) row[m.officeId] += qty;
        row.total += qty;
    });

    return [...byProduct.values()].sort((a, b) => a.productName.localeCompare(b.productName));
}

/** Products at or below `threshold` — the Dashboard's low-stock card. */
export async function lowStock(threshold = 100, officeId) {
    const rows = await stockReport({ officeId });
    return rows.filter(r => r.stock <= threshold).sort((a, b) => a.stock - b.stock);
}
