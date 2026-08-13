// audit_log — append-only (schema §7). There is no update and no delete here,
// deliberately: a log that can be edited is not a control.
//
// Ordinary create/update/delete entries are written for you by core.js, so a
// screen never calls writeAudit() for those. The two functions that do get
// called directly are logRuleOverride() and logAuth().

import { writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { COL } from './constants';
import { queueAudit, listDocs, toDate, ServiceError } from './core';

/** Write a standalone audit entry (no accompanying document change). */
export async function writeAudit(entry) {
    const batch = writeBatch(db);
    queueAudit(batch, entry);
    await batch.commit();
}

/**
 * Record that an Area Manager overrode a blocking rule.
 *
 * Prefer sales.createSale({ ruleChecks }) — it writes the override onto the
 * sale and into the log in the same batch, which is what makes the two
 * impossible to disagree. Use this only for an override applied to a sale that
 * already exists.
 */
export async function logRuleOverride({ saleId, code, reason, productId = null }) {
    if (!reason || !reason.trim()) {
        throw new ServiceError('VALIDATION', 'An override without a written reason is not permitted.');
    }
    return writeAudit({
        action: 'rule_override',
        collection: COL.SALES,
        docId: saleId,
        after: { code, productId },
        reason: reason.trim(),
    });
}

export async function logAuth(action, userId) {
    return writeAudit({ action, collection: COL.USERS, docId: userId });
}

/**
 * Read the log. Every argument is optional.
 *
 *   listAudit({ action: 'rule_override' })      // the demo query
 *   listAudit({ collection: 'sales', docId })   // one record's history
 */
export async function listAudit({ action, collection: col, docId, limit = 100 } = {}) {
    const rows = await listDocs(COL.AUDIT_LOG, {
        filters: [['action', '==', action], ['collection', '==', col], ['docId', '==', docId]],
        order: ['at', 'desc'],
        limit,
    });
    return rows.map(r => ({ ...r, at: toDate(r.at) }));
}

/** Convenience for the demonstration: every override, newest first. */
export const listOverrides = (limit = 50) => listAudit({ action: 'rule_override', limit });
