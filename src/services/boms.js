// boms — schema §10
//
// A bill of materials: what one unit of a finished product is made of. The
// screen is still called "Batch" in the menu, but SCREEN-AUDIT.md §3 item 1
// established that it never was a batch register — there is no lot number,
// manufacturing date or expiry date anywhere in it — and decision 2 in §7
// renamed it. The collection carries the honest name.
//
// `ratio` is per unit of output, which is what makes Repacking arithmetic
// rather than data entry: a 50 ml bottle filled from a 200 litre drum consumes
// 0.05 of a litre-unit, one bottle and one label. Multiply by the run size and
// you have the movements.

import { COL, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs, nextSequence,
    requireFields, assertEnum, toNumber, toTimestamp, ServiceError,
} from './core';
import { getProductOrThrow } from './products';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getBom = (no) => getById(COL.BOMS, no);
export const getBomOrThrow = (no) => getByIdOrThrow(COL.BOMS, no);

/** listBoms({ productId, status, search }) */
export async function listBoms({ productId, status = 'Active', search } = {}) {
    const rows = await listDocs(COL.BOMS, {
        filters: [['productId', '==', productId], ['status', '==', status]],
        order: ['bomNo', 'desc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(b => `${b.bomNo} ${b.productName || ''}`.toLowerCase().includes(k));
}

/** Options for the Repacking screen's recipe selector. */
export async function bomOptions(filter = {}) {
    const rows = await listBoms(filter);
    return rows.map(b => ({ value: b.bomNo, label: `${b.bomNo} — ${b.productName}`, bom: b }));
}

export const nextBomNo = async () => `AIB-${await nextSequence('boms', { padTo: 6 })}`;

/**
 * The recipe multiplied out for a run of `qty` units.
 * Used by the Repacking screen to show what a run will consume before it is
 * saved, and by repackings.js to build the movements.
 */
export const explodeBom = (bom, qty) =>
    (bom?.items || []).map(it => ({
        productId: it.productId,
        name: it.name,
        ratio: toNumber(it.ratio),
        qty: toNumber(it.ratio) * toNumber(qty),
    }));

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createBom({ productId, effectiveFrom, items: [{ productId, ratio }] })
 * The output product and every material are checked to exist, so a recipe can
 * never name something the catalogue does not have.
 */
export async function createBom(input) {
    requireFields(input, ['productId'], 'createBom');

    const lines = (input.items || []).filter(i => i && i.productId);
    if (!lines.length) throw new ServiceError('VALIDATION', 'A bill of materials needs at least one material.');

    const output = await getProductOrThrow(input.productId);

    const seen = new Set();
    const items = [];
    for (const line of lines) {
        if (seen.has(line.productId)) {
            throw new ServiceError('VALIDATION', `${line.productId} is on the recipe twice — add the ratios together instead.`);
        }
        seen.add(line.productId);

        const ratio = toNumber(line.ratio, 'ratio');
        if (ratio <= 0) throw new ServiceError('VALIDATION', 'Every material needs a ratio greater than zero.');

        const material = await getProductOrThrow(line.productId);
        if (material.code === output.code) {
            throw new ServiceError('VALIDATION', 'A product cannot be a material for itself.');
        }
        items.push({ productId: material.code, name: material.name, ratio });
    }

    const bomNo = input.bomNo || await nextBomNo();
    const data = {
        bomNo,
        productId: output.code,
        productName: output.name,
        items,
        effectiveFrom: toTimestamp(input.effectiveFrom ?? new Date()),
        status: input.status ?? 'Active',
    };
    assertEnum(data.status, STATUS, 'status');

    return createDoc(COL.BOMS, data, { id: bomNo });
}

export async function updateBom(bomNo, patch) {
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    const clean = { ...patch };
    if ('effectiveFrom' in clean) clean.effectiveFrom = toTimestamp(clean.effectiveFrom);
    // The number is the document ID, and the output product is what the recipe
    // IS — changing either means a new recipe, not an edited one.
    delete clean.bomNo;
    delete clean.productId;
    return updateDoc_(COL.BOMS, bomNo, clean);
}

export const deactivateBom = (bomNo, reason) => softDelete(COL.BOMS, bomNo, { reason });
