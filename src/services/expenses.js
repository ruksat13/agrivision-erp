// expenses — schema §10
//
// Depends on `expense_heads`, which is why SCREEN-AUDIT.md §2.1.1 puts this
// screen in group C and the head master in group A.
//
// `headName` is copied onto the expense so the list needs no join. That copy is
// NOT a historical record — §2's first denormalisation rule applies and
// renaming a head rewrites it, because an expense head after a spelling fix is
// the same head. A customer name on an old invoice is the opposite case.

import { COL, EXPENSE_TYPE, PAYMENT_STATUS } from './constants';
import {
    createDoc, updateDoc_, getById, getByIdOrThrow, listDocs, nextSequence,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money, ServiceError,
} from './core';
import { getExpenseHeadOrThrow } from './expenseHeads';
import { getUser } from './users';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getExpense = (code) => getById(COL.EXPENSES, code);
export const getExpenseOrThrow = (code) => getByIdOrThrow(COL.EXPENSES, code);

/** listExpenses({ type, headId, status, on, search }) */
export async function listExpenses({ type, headId, status, on, search } = {}) {
    const rows = await listDocs(COL.EXPENSES, {
        filters: [['type', '==', type], ['headId', '==', headId], ['status', '==', status]],
        order: ['code', 'desc'],
    });

    return rows.filter(e => {
        if (on) {
            const d = toDate(e.date);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (search) {
            const k = search.toLowerCase();
            const hay = `${e.headName || ''} ${e.code} ${e.voucherNo || ''} ${e.receivedByName || ''} ${e.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

/** Head Wise Expense — one of the eight reports kept (§8). Approved only. */
export async function expenseByHead({ from, to } = {}) {
    const rows = await listExpenses({ status: 'Approved' });
    const fromD = from ? toDate(from) : null;
    const toD = to ? toDate(to) : null;

    const byHead = new Map();
    rows.forEach(e => {
        const d = toDate(e.date);
        if (fromD && d < fromD) return;
        if (toD && d > toD) return;
        const key = e.headId;
        const row = byHead.get(key) || { headId: key, headName: e.headName, total: 0, count: 0 };
        // Income is recorded here too, so it is netted rather than added.
        row.total += (e.type === 'Income' ? -1 : 1) * toNumber(e.amount);
        row.count += 1;
        byHead.set(key, row);
    });

    return [...byHead.values()]
        .map(r => ({ ...r, total: money(r.total) }))
        .sort((a, b) => b.total - a.total);
}

export const nextExpenseCode = async () => `AIEX-${await nextSequence('expenses', { padTo: 6 })}`;
export const nextVoucherNo = async () => `V:${Number(await nextSequence('expense_vouchers', { padTo: 1 }))}`;

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createExpense({ type, headId, receivedById, amount, date, note })
 * Saved as Pending; approveExpense() is what marks it accepted.
 */
export async function createExpense(input) {
    requireFields(input, ['type', 'headId', 'amount', 'date'], 'createExpense');
    assertEnum(input.type, EXPENSE_TYPE, 'type');

    const amount = money(toNumber(input.amount, 'amount'));
    if (amount <= 0) throw new ServiceError('VALIDATION', 'An expense must be more than zero.');

    const head = await getExpenseHeadOrThrow(input.headId);
    const receiver = input.receivedById ? await getUser(input.receivedById) : null;

    const code = input.code || await nextExpenseCode();
    const data = {
        code,
        voucherNo: input.voucherNo || await nextVoucherNo(),
        type: input.type,
        headId: head.id,
        headName: head.name,
        receivedById: receiver?.id ?? null,
        receivedByName: receiver?.name ?? input.receivedByName ?? null,
        amount,
        date: toTimestamp(input.date),
        status: input.status ?? 'Pending',
        note: input.note?.trim() || null,
    };
    assertEnum(data.status, PAYMENT_STATUS, 'status');

    return createDoc(COL.EXPENSES, data, { id: code });
}

export async function updateExpense(code, patch) {
    const before = await getExpenseOrThrow(code);
    if (before.status !== 'Pending') {
        throw new ServiceError('CONFLICT', `Expense is ${before.status} — only a Pending expense can be edited.`);
    }
    const clean = { ...patch };
    if (clean.type) assertEnum(clean.type, EXPENSE_TYPE, 'type');
    if ('amount' in clean) {
        clean.amount = money(toNumber(clean.amount, 'amount'));
        if (clean.amount <= 0) throw new ServiceError('VALIDATION', 'An expense must be more than zero.');
    }
    if ('date' in clean) clean.date = toTimestamp(clean.date);
    if (clean.headId) {
        const head = await getExpenseHeadOrThrow(clean.headId);
        clean.headName = head.name;
    }
    delete clean.code;
    delete clean.voucherNo;
    delete clean.status;
    return updateDoc_(COL.EXPENSES, code, clean);
}

export async function approveExpense(code) {
    const before = await getExpenseOrThrow(code);
    if (before.status !== 'Pending') throw new ServiceError('CONFLICT', `Expense is already ${before.status}.`);
    return updateDoc_(COL.EXPENSES, code, { status: 'Approved' }, { action: 'approve' });
}

export async function cancelExpense(code, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling an expense needs a reason.');
    const before = await getExpenseOrThrow(code);
    if (before.status === 'Cancelled') throw new ServiceError('CONFLICT', 'That expense is already cancelled.');
    return updateDoc_(COL.EXPENSES, code, { status: 'Cancelled' }, { reason, action: 'delete' });
}
