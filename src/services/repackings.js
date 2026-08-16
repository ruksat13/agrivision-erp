// repackings — schema §10
//
// The one place in the system where stock moves in both directions at once: a
// run consumes its materials (`repack_out`) and produces the finished product
// (`repack_in`) in a single batch. That is the whole reason a bill of materials
// is worth keeping, and it is what SCREEN-AUDIT.md §4.4 meant by the broken
// Batch → Repacking chain — `Repacking.js:38` hardcoded three batch options and
// never read the twelve recipes sitting next door.
//
// The quantities consumed are SNAPSHOTTED onto the run. A recipe that is
// corrected next month must not silently rewrite what last month's run used.

import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, OFFICE, REPACK_STATUS } from './constants';
import {
    getById, getByIdOrThrow, listDocs, nextSequence, queueAudit,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, ServiceError,
} from './core';
import { getProductOrThrow } from './products';
import { getBomOrThrow, explodeBom } from './boms';
import { buildMovement, queueMovements, getStockBalance } from './stock';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getRepacking = (no) => getById(COL.REPACKINGS, no);
export const getRepackingOrThrow = (no) => getByIdOrThrow(COL.REPACKINGS, no);

/** listRepackings({ outputProductId, status, officeId, on, search }) */
export async function listRepackings({ outputProductId, status, officeId, on, search } = {}) {
    const rows = await listDocs(COL.REPACKINGS, {
        filters: [
            ['outputProductId', '==', outputProductId],
            ['status', '==', status],
            ['officeId', '==', officeId],
        ],
        order: ['repackNo', 'desc'],
    });

    return rows.filter(r => {
        if (on) {
            const d = toDate(r.repackDate);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (search) {
            const k = search.toLowerCase();
            const hay = `${r.repackNo} ${r.outputProductName || ''} ${r.bomId || ''} ${r.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

export const nextRepackNo = async () => `AIR-${await nextSequence('repackings', { padTo: 6 })}`;

/**
 * What a run of `qty` from this BOM would consume, and whether the office
 * actually holds it. Called by the screen before saving so the shortfall is
 * visible rather than being an error message after the fact.
 */
export async function checkMaterials(bom, qty, officeId) {
    const needed = explodeBom(bom, qty);
    return Promise.all(needed.map(async (n) => {
        const held = await getStockBalance(n.productId, officeId);
        return { ...n, held, short: n.qty > held ? n.qty - held : 0 };
    }));
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createRepacking({ bomId, qty, officeId, repackDate, cartonQty, note })
 *
 * Consumes and produces in one batch. Refused if any material is short: the
 * alternative is a negative stock balance, and `verify.mjs` asserts that no
 * product/office pair ever holds one.
 */
export async function createRepacking(input) {
    requireFields(input, ['bomId', 'qty', 'officeId'], 'createRepacking');
    assertEnum(input.officeId, OFFICE, 'officeId');

    const qty = toNumber(input.qty, 'qty');
    if (qty <= 0) throw new ServiceError('VALIDATION', 'A repacking run must produce more than zero units.');

    const bom = await getBomOrThrow(input.bomId);
    const output = await getProductOrThrow(bom.productId);

    const checked = await checkMaterials(bom, qty, input.officeId);
    const short = checked.filter(c => c.short > 0);
    if (short.length) {
        throw new ServiceError(
            'CONFLICT',
            `Not enough material for ${qty} × ${output.name}: ${short.map(s => `${s.name} short by ${Math.round(s.short * 1000) / 1000}`).join(', ')}.`,
            { short },
        );
    }

    const materials = await Promise.all(checked.map(c => getProductOrThrow(c.productId)));
    const repackNo = input.repackNo || await nextRepackNo();
    const repackDate = toTimestamp(input.repackDate ?? new Date());
    const cartonQty = toNumber(input.cartonQty ?? output.cartonQty ?? 1, 'cartonQty');

    const data = {
        repackNo,
        bomId: bom.bomNo,
        outputProductId: output.code,
        outputProductName: output.name,
        qty,
        cartonQty,
        cartons: cartonQty > 0 ? Math.floor(qty / cartonQty) : 0,
        officeId: input.officeId,
        repackDate,
        // Snapshotted: a recipe corrected next month must not rewrite this run.
        consumed: checked.map(c => ({
            productId: c.productId, name: c.name, ratio: c.ratio, qty: c.qty,
        })),
        status: 'Done',
        note: input.note?.trim() || null,
    };
    assertEnum(data.status, REPACK_STATUS, 'status');

    const batch = writeBatch(db);
    batch.set(doc(db, COL.REPACKINGS, repackNo), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

    // Out: the materials. In: the finished product. One batch.
    queueMovements(batch, checked.map((c, i) => buildMovement({
        product: materials[i],
        officeId: input.officeId,
        type: 'repack_out',              // outward — buildMovement signs it negative
        qty: c.qty,
        refType: COL.REPACKINGS,
        refId: repackNo,
        movedAt: repackDate,
    })));

    queueMovements(batch, [buildMovement({
        product: output,
        officeId: input.officeId,
        type: 'repack_in',
        qty,
        refType: COL.REPACKINGS,
        refId: repackNo,
        movedAt: repackDate,
    })]);

    queueAudit(batch, { action: 'create', collection: COL.REPACKINGS, docId: repackNo, after: data });
    await batch.commit();

    return data;
}

/**
 * Cancel a run: the finished goods go back out and the materials come back in,
 * the exact inverse of what the run did. Refused if the output has already
 * moved on — you cannot un-make what has been sold.
 */
export async function cancelRepacking(repackNo, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling a repacking run needs a reason.');
    const run = await getRepackingOrThrow(repackNo);
    if (run.status === 'Cancelled') throw new ServiceError('CONFLICT', 'That run is already cancelled.');

    const output = await getProductOrThrow(run.outputProductId);
    const held = await getStockBalance(run.outputProductId, run.officeId);
    if (toNumber(run.qty) > held) {
        throw new ServiceError(
            'CONFLICT',
            `Cannot cancel: only ${held} × ${output.name} left at this office, and the run made ${run.qty}. Some has already moved on.`,
        );
    }

    const materials = await Promise.all(run.consumed.map(c => getProductOrThrow(c.productId)));

    const batch = writeBatch(db);
    batch.update(doc(db, COL.REPACKINGS, repackNo), {
        status: 'Cancelled', cancelReason: reason,
        cancelledAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    queueMovements(batch, [buildMovement({
        product: output,
        officeId: run.officeId,
        type: 'repack_out',
        qty: run.qty,
        refType: COL.REPACKINGS,
        refId: repackNo,
        movedAt: new Date(),
    })]);

    queueMovements(batch, run.consumed.map((c, i) => buildMovement({
        product: materials[i],
        officeId: run.officeId,
        type: 'repack_in',
        qty: c.qty,
        refType: COL.REPACKINGS,
        refId: repackNo,
        movedAt: new Date(),
    })));

    queueAudit(batch, {
        action: 'delete', collection: COL.REPACKINGS, docId: repackNo,
        before: run, after: { status: 'Cancelled' }, reason,
    });
    await batch.commit();

    return { ...run, status: 'Cancelled' };
}
