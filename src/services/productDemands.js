// product_demands — schema §10
//
// An inter-office stock request: this office asks that office for these
// quantities by this date.
//
// The lines live on the document as an embedded array rather than in a
// collection of their own. A request is read whole and printed whole; nothing
// queries across the lines of every request the way Products Sales queries
// across `sale_items`, which is the reason D2 gave for splitting those out.
//
// `stockAtRequest` is deliberately a snapshot. The detail page prints the stock
// figure the request was justified by, not today's — recomputing it later would
// quietly rewrite the document.

import { COL, DEMAND_STATUS, OFFICE } from './constants';
import {
    createDoc, updateDoc_, getById, getByIdOrThrow, listDocs, nextSequence,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, ServiceError, serverTimestamp,
} from './core';
import { getProductOrThrow } from './products';
import { getStockBalance } from './stock';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getDemand = (requestNo) => getById(COL.PRODUCT_DEMANDS, requestNo);
export const getDemandOrThrow = (requestNo) => getByIdOrThrow(COL.PRODUCT_DEMANDS, requestNo);

/** listDemands({ status, fromOfficeId, toOfficeId, expectedOn, search }) */
export async function listDemands({ status, fromOfficeId, toOfficeId, expectedOn, search } = {}) {
    const rows = await listDocs(COL.PRODUCT_DEMANDS, {
        filters: [
            ['status', '==', status],
            ['fromOfficeId', '==', fromOfficeId],
            ['toOfficeId', '==', toOfficeId],
        ],
        order: ['requestNo', 'desc'],
    });

    return rows.filter(r => {
        if (expectedOn) {
            const d = toDate(r.expectedDate);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            if (local !== expectedOn) return false;
        }
        if (search && !r.requestNo.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
}

/** The next request number, e.g. AIPR-000217. */
export const nextRequestNo = async () => `AIPR-${await nextSequence('product_demands', { padTo: 6 })}`;

/**
 * Total cartons across the lines, as the detail page's footer shows it:
 * whole cartons plus the loose pieces left over.
 */
export function demandTotals(demand) {
    let cartons = 0;
    let pieces = 0;
    (demand?.items || []).forEach(it => {
        const per = toNumber(it.cartonQty || 1);
        const qty = toNumber(it.demandQty);
        cartons += Math.floor(qty / per);
        pieces += qty % per;
    });
    return { cartons, pieces, label: `${cartons}, ${pieces} pcs` };
}

/** "600/6" over "100" — the pack notation the screens use. §2 calls it presentation. */
export const packNotation = (qty, cartonQty) => {
    const per = toNumber(cartonQty || 1);
    const n = toNumber(qty);
    return per > 1 ? `${n}/${per}\n${Math.floor(n / per)}${n % per ? `, ${n % per} pcs.` : ''}` : String(n);
};

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * Resolve one form line into a stored line: the product's own fields are copied
 * across so the request prints correctly after the product is renamed, and the
 * stock balance is read once, here.
 */
async function buildItem({ productId, demandQty }, fromOfficeId) {
    const qty = toNumber(demandQty, 'demandQty');
    if (qty <= 0) throw new ServiceError('VALIDATION', `Line ${productId}: demand quantity must be more than zero.`);

    const product = await getProductOrThrow(productId);
    return {
        productId: product.code,
        name: product.name,
        packSize: product.packSize ?? null,
        cartonQty: toNumber(product.cartonQty ?? 1),
        demandQty: qty,
        stockAtRequest: await getStockBalance(product.code, fromOfficeId),
    };
}

/**
 * createDemand({ fromOfficeId, toOfficeId, expectedDate, note,
 *                items: [{ productId, demandQty }] })
 */
export async function createDemand(input) {
    requireFields(input, ['fromOfficeId', 'toOfficeId', 'expectedDate'], 'createDemand');
    assertEnum(input.fromOfficeId, OFFICE, 'fromOfficeId');
    assertEnum(input.toOfficeId, OFFICE, 'toOfficeId');
    if (input.fromOfficeId === input.toOfficeId) {
        throw new ServiceError('VALIDATION', 'An office cannot raise a request against itself.');
    }

    const lines = (input.items || []).filter(i => i && i.productId);
    if (!lines.length) throw new ServiceError('VALIDATION', 'A request needs at least one product line.');

    const seen = new Set();
    lines.forEach(l => {
        if (seen.has(l.productId)) {
            throw new ServiceError('VALIDATION', `${l.productId} is on the request twice — add the quantities together instead.`);
        }
        seen.add(l.productId);
    });

    const items = [];
    for (const line of lines) items.push(await buildItem(line, input.fromOfficeId));

    const status = input.status ?? 'Pending';
    assertEnum(status, DEMAND_STATUS, 'status');

    const requestNo = input.requestNo || await nextRequestNo();
    const data = {
        requestNo,
        fromOfficeId: input.fromOfficeId,
        toOfficeId: input.toOfficeId,
        expectedDate: toTimestamp(input.expectedDate),
        requestedAt: serverTimestamp(),
        status,
        note: input.note?.trim() || null,
        items,
    };
    return createDoc(COL.PRODUCT_DEMANDS, data, { id: requestNo });
}

/**
 * Move a request along. `Cancel` needs a reason for the same reason a cancelled
 * sale does — somebody has to be answerable for the stock that never moved.
 */
export async function setDemandStatus(requestNo, status, reason = null) {
    assertEnum(status, DEMAND_STATUS, 'status');
    if (status === 'Cancel' && !reason) {
        throw new ServiceError('VALIDATION', 'Cancelling a request needs a reason.');
    }
    // A cancellation is logged as 'delete', which is what every other cancel
    // path in the system records. Leaving it as the default 'update' put
    // cancelled requests outside listAudit({ action: 'delete' }) — the one
    // query that is meant to answer "what was withdrawn, and why".
    return updateDoc_(COL.PRODUCT_DEMANDS, requestNo, { status }, {
        reason,
        action: status === 'Cancel' ? 'delete' : 'update',
    });
}
