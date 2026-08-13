// licences — schema §4.3. One collection for both the company's own licences
// and dealers', separated by `scope` (decision D4).
//
// This module carries Feature 1. The important function is
// licenceCheckFor(dealerLicences, product, saleDate), which is what the sale
// rule calls.

import { COL, LICENCE_SCOPE, LICENCE_TYPE, LICENCE_FOR_CATEGORY, RULE_CODE } from './constants';
import {
    createDoc, updateDoc_, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, toTimestamp, toDate,
} from './core';

const DAY = 24 * 60 * 60 * 1000;

// ── Derived status (decision D5 — never stored) ───────────────────────────

/**
 * daysToExpiry(licence, asAt?) → integer; negative once expired.
 * Always pass the sale date when checking a sale, not today's date.
 */
export function daysToExpiry(licence, asAt = new Date()) {
    const expiry = toDate(licence?.expiryDate);
    if (!expiry) return null;
    const from = toDate(asAt) ?? new Date();
    return Math.floor((expiry.getTime() - from.getTime()) / DAY);
}

/** 'Expired' | 'Expiring (7)' | 'Expiring (30)' | 'Expiring (60)' | 'Active' */
export function licenceStatus(licence, asAt = new Date()) {
    const days = daysToExpiry(licence, asAt);
    if (days === null) return 'Unknown';
    if (days < 0) return 'Expired';
    if (days <= 7) return 'Expiring (7)';
    if (days <= 30) return 'Expiring (30)';
    if (days <= 60) return 'Expiring (60)';
    return 'Active';
}

export const isExpired = (licence, asAt = new Date()) => daysToExpiry(licence, asAt) < 0;

/** Attach the derived status so a table can render it without recomputing. */
export const withStatus = (licence, asAt) => ({
    ...licence,
    status: licenceStatus(licence, asAt),
    daysRemaining: daysToExpiry(licence, asAt),
});

// ── Reads ─────────────────────────────────────────────────────────────────

export const getLicence = (id) => getById(COL.LICENCES, id);
export const getLicenceOrThrow = (id) => getByIdOrThrow(COL.LICENCES, id);

/**
 * listLicences({ scope, holderId, licenceType })
 * Rows come back with the derived status attached.
 *
 *   listLicences({ scope: 'company' })   // the License screen's first mode
 *   listLicences({ scope: 'dealer' })    // its second mode
 */
export async function listLicences({ scope, holderId, licenceType } = {}) {
    const rows = await listDocs(COL.LICENCES, {
        filters: [['scope', '==', scope], ['holderId', '==', holderId], ['licenceType', '==', licenceType]],
        order: ['expiryDate', 'asc'],
    });
    return rows.map(r => withStatus(r));
}

export const getDealerLicences = (dealerCode) => listLicences({ scope: 'dealer', holderId: dealerCode });

/**
 * The dashboard panel: licences expiring within `days`, plus those already
 * expired. Sorted soonest first.
 */
export async function listExpiring({ scope = 'dealer', withinDays = 60 } = {}) {
    const rows = await listLicences({ scope });
    return rows.filter(r => r.daysRemaining !== null && r.daysRemaining <= withinDays);
}

/** Counts for the 60 / 30 / 7 / expired cards. */
export async function expirySummary({ scope = 'dealer' } = {}) {
    const rows = await listLicences({ scope });
    const d = (r) => r.daysRemaining;
    return {
        expired: rows.filter(r => d(r) !== null && d(r) < 0).length,
        within7: rows.filter(r => d(r) >= 0 && d(r) <= 7).length,
        within30: rows.filter(r => d(r) >= 0 && d(r) <= 30).length,
        within60: rows.filter(r => d(r) >= 0 && d(r) <= 60).length,
        active: rows.filter(r => d(r) > 60).length,
        total: rows.length,
    };
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createLicence({ scope, holderId, holderName, licenceType, licenceNo,
 *                 issuingAuthority, issueDate, expiryDate })
 * `holderId` is required for a dealer licence and must be null for a company one.
 */
export async function createLicence(input) {
    requireFields(input, ['scope', 'holderName', 'licenceType', 'licenceNo', 'issuingAuthority', 'issueDate', 'expiryDate'], 'createLicence');
    assertEnum(input.scope, LICENCE_SCOPE, 'scope');
    assertEnum(input.licenceType, LICENCE_TYPE, 'licenceType');
    if (input.scope === 'dealer') requireFields(input, ['holderId'], 'createLicence (dealer)');

    return createDoc(COL.LICENCES, {
        scope: input.scope,
        holderId: input.scope === 'dealer' ? input.holderId : null,
        holderName: input.holderName,
        licenceType: input.licenceType,
        licenceNo: input.licenceNo,
        issuingAuthority: input.issuingAuthority,
        issueDate: toTimestamp(input.issueDate),
        expiryDate: toTimestamp(input.expiryDate),
        documentUrl: input.documentUrl ?? null,
        note: input.note ?? null,
    });
}

export async function updateLicence(id, patch) {
    if (patch.scope) assertEnum(patch.scope, LICENCE_SCOPE, 'scope');
    if (patch.licenceType) assertEnum(patch.licenceType, LICENCE_TYPE, 'licenceType');
    const clean = { ...patch };
    if ('issueDate' in clean) clean.issueDate = toTimestamp(clean.issueDate);
    if ('expiryDate' in clean) clean.expiryDate = toTimestamp(clean.expiryDate);
    // status is derived (D5) — refuse to store it, or it will go stale
    delete clean.status;
    delete clean.daysRemaining;
    return updateDoc_(COL.LICENCES, id, clean);
}

/** Record a renewal: new number and new expiry on the same licence record. */
export const renewLicence = (id, { licenceNo, issueDate, expiryDate }) =>
    updateLicence(id, { licenceNo, issueDate, expiryDate });

// ── Feature 1 — the rule ──────────────────────────────────────────────────

/** Which licence type authorises this product? null when none is required. */
export const requiredLicenceType = (product) => LICENCE_FOR_CATEGORY[product?.category] ?? null;

/**
 * The Feature 1 check for one product on one order.
 *
 *   const licences = await getDealerLicences(customer.code);
 *   const problem  = licenceCheckFor(licences, product, sale.saleDate);
 *
 * Returns null when the line is permitted, or a rule object in the same shape
 * as every other entry in sales.ruleChecks.
 *
 * `saleDate` matters: a sale backdated to before the licence lapsed is lawful,
 * and comparing against today's date would wrongly refuse it.
 */
export function licenceCheckFor(dealerLicences, product, saleDate = new Date()) {
    const needed = requiredLicenceType(product);
    if (!needed) return null;                       // packaging, gifts — no licence required

    const held = (dealerLicences || []).filter(l => l.licenceType === needed);

    if (held.length === 0) {
        return {
            level: 'block',
            code: RULE_CODE.LICENCE_MISSING,
            productId: product.code,
            message: `No ${needed} licence on record for this dealer — ${product.name} cannot be supplied.`,
            overridable: true,
        };
    }

    // Valid if any held licence of that type is still in date on the sale date.
    const valid = held.find(l => daysToExpiry(l, saleDate) >= 0);
    if (valid) return null;

    const latest = held.reduce((a, b) => (daysToExpiry(a, saleDate) > daysToExpiry(b, saleDate) ? a : b));
    const expiredOn = toDate(latest.expiryDate);
    return {
        level: 'block',
        code: RULE_CODE.LICENCE_EXPIRED,
        productId: product.code,
        message: `${needed} licence ${latest.licenceNo} expired on ${expiredOn.toISOString().slice(0, 10)} — ${product.name} cannot be supplied.`,
        overridable: true,
    };
}

/**
 * The compliance report: every dealer licence with its status and days
 * remaining, worst first.
 */
export async function complianceReport() {
    const rows = await listLicences({ scope: 'dealer' });
    return rows.sort((a, b) => (a.daysRemaining ?? 1e9) - (b.daysRemaining ?? 1e9));
}
