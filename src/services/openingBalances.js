// opening_balances — schema §10
//
// One collection for both the customer and the supplier screen, separated by
// `party`. That is decision D4's reasoning reused: the two screens hold the
// same fields, and "show me every opening entry posted in March" should be one
// query rather than two.
//
// The whole of the difficulty in this file is one line:
//
//     customer   Debit +   Credit −      (balance is a receivable)
//     supplier   Debit −   Credit +      (balance is a payable)
//
// which lives in BALANCE_SIGN in constants.js and is applied only by
// signedDelta() below. Everything else is bookkeeping around it.

import { doc, collection, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COL, PARTY, ENTRY_TYPE, OPENING_STATUS, BALANCE_SIGN } from './constants';
import {
    updateDoc_, getById, listDocs, queueAudit,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money, ServiceError,
} from './core';
import { getCustomerOrThrow } from './customers';
import { getSupplierOrThrow } from './suppliers';

const partyCollection = (party) => (party === 'customer' ? COL.CUSTOMERS : COL.SUPPLIERS);
const loadParty = (party, id) => (party === 'customer' ? getCustomerOrThrow(id) : getSupplierOrThrow(id));

/**
 * How much this entry moves the party's balance, sign included.
 * The single place the Debit/Credit convention is applied.
 */
export function signedDelta({ party, type, amount }) {
    assertEnum(party, PARTY, 'party');
    assertEnum(type, ENTRY_TYPE, 'type');
    return money(BALANCE_SIGN[party][type] * toNumber(amount, 'amount'));
}

// ── Reads ─────────────────────────────────────────────────────────────────

export const getOpeningBalance = (id) => getById(COL.OPENING_BALANCES, id);

/** listOpeningBalances({ party, partyId, status, on, search }) */
export async function listOpeningBalances({ party, partyId, status, on, search } = {}) {
    const rows = await listDocs(COL.OPENING_BALANCES, {
        filters: [['party', '==', party], ['partyId', '==', partyId], ['status', '==', status]],
        order: ['date', 'desc'],
    });

    return rows.filter(r => {
        if (on) {
            const d = toDate(r.date);
            if (!d) return false;
            const pad = (n) => String(n).padStart(2, '0');
            if (`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` !== on) return false;
        }
        if (search) {
            const k = search.toLowerCase();
            const hay = `${r.partyName || ''} ${r.partyCode || ''} ${r.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createOpeningBalance({ party, partyId, type, amount, date, note })
 *
 * The entry and the balance move in ONE batch. An opening balance that is
 * recorded but not reflected in the master, or the reverse, is worse than
 * neither — so it is not possible to write one without the other.
 */
export async function createOpeningBalance(input) {
    requireFields(input, ['party', 'partyId', 'type', 'amount', 'date'], 'createOpeningBalance');
    assertEnum(input.party, PARTY, 'party');
    assertEnum(input.type, ENTRY_TYPE, 'type');

    const amount = money(toNumber(input.amount, 'amount'));
    if (amount <= 0) throw new ServiceError('VALIDATION', 'An opening balance must be more than zero.');

    const partyDoc = await loadParty(input.party, input.partyId);
    const delta = signedDelta({ party: input.party, type: input.type, amount });

    const data = {
        party: input.party,
        partyId: input.partyId,
        partyName: partyDoc.name,
        partyCode: partyDoc.code,
        type: input.type,
        amount,
        date: toTimestamp(input.date),
        status: 'Approved',
        note: input.note?.trim() || null,
    };

    const ref = doc(collection(db, COL.OPENING_BALANCES));
    const batch = writeBatch(db);

    batch.set(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.update(doc(db, partyCollection(data.party), data.partyId), {
        balance: increment(delta),
        updatedAt: serverTimestamp(),
    });
    queueAudit(batch, { action: 'create', collection: COL.OPENING_BALANCES, docId: ref.id, after: data });
    queueAudit(batch, {
        action: 'update',
        collection: partyCollection(data.party),
        docId: data.partyId,
        after: { balanceDelta: delta, refType: COL.OPENING_BALANCES, refId: ref.id },
        reason: `Opening balance ${data.type} ${amount}`,
    });

    await batch.commit();
    return { id: ref.id, ...data };
}

/**
 * Cancelling posts the reversal rather than editing the original. The entry
 * stays visible with status `Cancel`, which is what the sample row at
 * `SupplierOpeningBalance.js:21` was always showing.
 */
export async function cancelOpeningBalance(id, reason) {
    if (!reason) throw new ServiceError('VALIDATION', 'Cancelling an opening balance needs a reason.');
    const entry = await getOpeningBalance(id);
    if (!entry) throw new ServiceError('NOT_FOUND', `opening_balances/${id} does not exist.`);
    if (entry.status === 'Cancel') throw new ServiceError('CONFLICT', 'That entry is already cancelled.');
    assertEnum('Cancel', OPENING_STATUS, 'status');

    const reversal = -signedDelta({ party: entry.party, type: entry.type, amount: entry.amount });

    const batch = writeBatch(db);
    batch.update(doc(db, COL.OPENING_BALANCES, id), { status: 'Cancel', updatedAt: serverTimestamp() });
    batch.update(doc(db, partyCollection(entry.party), entry.partyId), {
        balance: increment(reversal),
        updatedAt: serverTimestamp(),
    });
    queueAudit(batch, {
        action: 'delete',
        collection: COL.OPENING_BALANCES,
        docId: id,
        before: entry,
        after: { status: 'Cancel', balanceDelta: reversal },
        reason,
    });
    await batch.commit();
    return { ...entry, status: 'Cancel' };
}

export const updateOpeningBalanceNote = (id, note) =>
    updateDoc_(COL.OPENING_BALANCES, id, { note: note?.trim() || null });
