// expense_heads — schema §10
//
// The smallest collection in the system: a name and a status. It exists as its
// own collection rather than as a string on `expenses` because an expense
// posted last month must still resolve its head after the head is renamed —
// `expenses.headId` points here and carries `headName` as a denormalised copy.
//
// This module is the worked minimum of the pattern in products.js. If you are
// migrating one of the other Tier 2 collections, read this one first.

import { COL, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, ServiceError,
} from './core';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getExpenseHead = (id) => getById(COL.EXPENSE_HEADS, id);
export const getExpenseHeadOrThrow = (id) => getByIdOrThrow(COL.EXPENSE_HEADS, id);

/**
 * listExpenseHeads({ status, search })
 *
 * Pass `status: null` to include deactivated heads — the master screen shows
 * them so that a head referenced by an old expense is still visible.
 */
export async function listExpenseHeads({ status = 'Active', search } = {}) {
    const rows = await listDocs(COL.EXPENSE_HEADS, {
        filters: [['status', '==', status]],
        order: ['name', 'asc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(h => h.name.toLowerCase().includes(k));
}

/** Options for the Expense screen's head selector. */
export async function expenseHeadOptions(filter = {}) {
    const rows = await listExpenseHeads(filter);
    return rows.map(h => ({ value: h.id, label: h.name, head: h }));
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * A head whose name already exists is almost always a typo repeated, not a
 * second real head — and two heads with one name make Head Wise Expense
 * meaningless. Checked here rather than with a unique index, which Firestore
 * does not have.
 */
async function assertNameFree(name, { exceptId } = {}) {
    const clash = (await listExpenseHeads({ status: null }))
        .find(h => h.name.trim().toLowerCase() === name.trim().toLowerCase() && h.id !== exceptId);
    if (clash) {
        throw new ServiceError('CONFLICT', `An expense head named "${clash.name}" already exists.`);
    }
}

/** createExpenseHead({ name }) */
export async function createExpenseHead(input) {
    requireFields(input, ['name'], 'createExpenseHead');
    const name = String(input.name).trim();
    await assertNameFree(name);

    const data = { name, status: input.status ?? 'Active' };
    assertEnum(data.status, STATUS, 'status');
    return createDoc(COL.EXPENSE_HEADS, data);
}

export async function updateExpenseHead(id, patch) {
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    const clean = { ...patch };
    if ('name' in clean) {
        clean.name = String(clean.name).trim();
        if (!clean.name) throw new ServiceError('VALIDATION', 'An expense head needs a name.');
        await assertNameFree(clean.name, { exceptId: id });
    }
    return updateDoc_(COL.EXPENSE_HEADS, id, clean);
}

export const deactivateExpenseHead = (id, reason) => softDelete(COL.EXPENSE_HEADS, id, { reason });
