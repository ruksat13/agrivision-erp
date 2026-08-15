// bank_accounts — schema §10
//
// The company's own accounts, not a dealer's. Supplier Payment and Cash
// Collection pick one of these, which is why the account number is guarded for
// uniqueness: two rows carrying the same number make "which account was this
// paid from" unanswerable.

import { COL, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, ServiceError,
} from './core';

// ── Reads ─────────────────────────────────────────────────────────────────

export const getBankAccount = (id) => getById(COL.BANK_ACCOUNTS, id);
export const getBankAccountOrThrow = (id) => getByIdOrThrow(COL.BANK_ACCOUNTS, id);

/** listBankAccounts({ status, bank, search }) — `search` covers name and number. */
export async function listBankAccounts({ status = 'Active', bank, search } = {}) {
    const rows = await listDocs(COL.BANK_ACCOUNTS, {
        filters: [['status', '==', status], ['bank', '==', bank]],
        order: ['name', 'asc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(a =>
        a.name.toLowerCase().includes(k) ||
        a.number.includes(search) ||
        (a.bank || '').toLowerCase().includes(k));
}

/** Options for a payment screen's "paid from" selector. */
export async function bankAccountOptions(filter = {}) {
    const rows = await listBankAccounts(filter);
    return rows.map(a => ({ value: a.id, label: `${a.name} — ${a.bank} (${a.number})`, account: a }));
}

// ── Writes ────────────────────────────────────────────────────────────────

async function assertNumberFree(number, { exceptId } = {}) {
    const clash = (await listBankAccounts({ status: null }))
        .find(a => String(a.number).trim() === String(number).trim() && a.id !== exceptId);
    if (clash) {
        throw new ServiceError('CONFLICT', `Account number ${clash.number} is already recorded as "${clash.name}".`);
    }
}

/** createBankAccount({ name, number, bank, branch }) */
export async function createBankAccount(input) {
    requireFields(input, ['name', 'number', 'bank', 'branch'], 'createBankAccount');
    const number = String(input.number).trim();
    await assertNumberFree(number);

    const data = {
        name: String(input.name).trim(),
        number,
        bank: String(input.bank).trim(),
        branch: String(input.branch).trim(),
        status: input.status ?? 'Active',
    };
    assertEnum(data.status, STATUS, 'status');
    return createDoc(COL.BANK_ACCOUNTS, data);
}

export async function updateBankAccount(id, patch) {
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    const clean = { ...patch };
    if ('number' in clean) {
        clean.number = String(clean.number).trim();
        await assertNumberFree(clean.number, { exceptId: id });
    }
    ['name', 'bank', 'branch'].forEach(f => { if (f in clean) clean[f] = String(clean[f]).trim(); });
    return updateDoc_(COL.BANK_ACCOUNTS, id, clean);
}

export const deactivateBankAccount = (id, reason) => softDelete(COL.BANK_ACCOUNTS, id, { reason });
