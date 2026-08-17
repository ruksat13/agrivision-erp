// licences — schema §4.3. One collection for both the company's own licences
// and dealers', separated by `scope` (decision D4).
//
// This module carries Feature 1. The important function is
// licenceCheckFor(dealerLicences, product, saleDate), which is what the sale
// rule calls.

import { COL, LICENCE_SCOPE, LICENCE_TYPE, LICENCE_FOR_CATEGORY, RULE_CODE } from './constants';
import {
    createDoc, updateDoc_, getById, getByIdOrThrow, listDocs, actorScope,
    requireFields, assertEnum, toTimestamp, toDate, formatDate, toNumber, money,
} from './core';
import { listCustomers } from './customers';

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

/**
 * Counts for the 60 / 30 / 7 / expired cards, from licence rows already read.
 *
 * Separate from expirySummary() so complianceReport() can count the rows it is
 * actually showing rather than issuing a second, unscoped read — one definition
 * of a band, two callers, and no way for the cards to contradict the table.
 *
 * The bands NEST: a licence with 5 days left is inside all of within7, within30
 * and within60. Only `expired` and `active` are exclusive. The screen says so.
 */
export function countByBand(rows) {
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

/** Counts for the 60 / 30 / 7 / expired cards, reading the licences itself. */
export async function expirySummary({ scope = 'dealer' } = {}) {
    return countByBand(await listLicences({ scope }));
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
    return {
        level: 'block',
        code: RULE_CODE.LICENCE_EXPIRED,
        productId: product.code,
        message: `${needed} licence ${latest.licenceNo} expired on ${formatDate(latest.expiryDate)} — ${product.name} cannot be supplied.`,
        overridable: true,
    };
}

// ── Feature 1 part 6 — the compliance report ──────────────────────────────

/** The blocks that mean "supplied without valid licence cover". */
const LICENCE_RULE_CODES = [RULE_CODE.LICENCE_EXPIRED, RULE_CODE.LICENCE_MISSING];

/**
 * Value supplied under an overridden licence block, keyed by
 * `${dealerId}|${licenceType}` — UNIQUE-FEATURES.md §5 Feature 1 point 6.
 *
 * Nothing new is stored to make this work. A sale already carries `ruleChecks`,
 * and an override sets `overridden` on the entry that was waived, so the sales
 * that went out under a bad licence are already identifiable. The figure is the
 * LINE total of the products the block actually named, not the invoice total —
 * the other lines on that invoice were lawful and adding them would overstate
 * the exposure, which on a compliance screen is its own kind of wrong.
 *
 * `sale_items.category` maps to a licence type through LICENCE_FOR_CATEGORY, so
 * the value lands on the specific licence that was out of date rather than on
 * the dealer as a whole.
 *
 * Cost: Firestore cannot query inside an array of maps, so the ruleChecks
 * filter is applied in memory over `sales` — the approach listPurchases() and
 * listCommissions() already take. The per-sale line lookup that follows runs
 * only for sales that carry an override, and an override needs a manager's
 * written reason, so that set stays small by construction.
 *
 * Scoped by actorScope(), for the reason listCustomers() is: `sales` is
 * readable by an Area Manager only where `areaId` is theirs, and Security Rules
 * refuse an unscoped LIST rather than narrowing it. Asking for every sale gave
 * an Area Manager permission-denied and an empty compliance report.
 *
 * The scope changes what the figure MEANS, not just whether it loads: an Area
 * Manager gets the exposure in their own area, which is the number they can act
 * on. Super Admin, Managing Director and Accountant read the collection
 * unconditionally and keep the company-wide total. complianceReport() reports
 * which of the two the caller is looking at, so a partial figure is never
 * presented as a total.
 */
export async function overriddenLicenceValue() {
    const scope = actorScope();
    const sales = await listDocs(COL.SALES, {
        filters: [['areaId', '==', scope.areaId], ['officerId', '==', scope.officerId]],
    });
    const waived = sales.filter(s =>
        s.status !== 'Cancelled'
        && (s.ruleChecks || []).some(r => r.overridden && LICENCE_RULE_CODES.includes(r.code)));

    const byKey = new Map();

    for (const sale of waived) {
        // The scope goes on this query too. `sale_items` is row-scoped by the
        // same rule as `sales` — it carries its own denormalised officerId and
        // areaId precisely so it can be (schema D2) — so filtering by saleId
        // alone is an unscoped LIST and is refused, even though every line it
        // would return belongs to a sale this caller just read. Scoping only
        // the outer query left the report still failing for an Area Manager,
        // one level further down than before.
        //
        // Two equality filters need no composite index: Firestore serves those
        // from its automatic single-field indexes.
        const items = await listDocs(COL.SALE_ITEMS, {
            filters: [
                ['saleId', '==', sale.invoiceNo],
                ['areaId', '==', scope.areaId],
                ['officerId', '==', scope.officerId],
            ],
        });
        const byProduct = new Map(items.map(it => [it.productId, it]));

        (sale.ruleChecks || [])
            .filter(r => r.overridden && LICENCE_RULE_CODES.includes(r.code))
            .forEach(r => {
                const item = byProduct.get(r.productId);
                if (!item) return;                       // line removed before saving
                const type = LICENCE_FOR_CATEGORY[item.category] ?? null;
                if (!type) return;                       // category needs no licence
                const key = `${sale.customerId}|${type}`;
                byKey.set(key, money((byKey.get(key) || 0) + toNumber(item.lineTotal)));
            });
    }

    return byKey;
}

/** Everything waived against one dealer, whichever licence type was named. */
const dealerTotal = (byKey, dealerId) =>
    money([...byKey.entries()]
        .filter(([k]) => k.startsWith(`${dealerId}|`))
        .reduce((sum, [, v]) => sum + v, 0));

/**
 * The compliance report: every dealer licence with its status, days remaining
 * and the value sold under an override — worst first.
 *
 * Rows are NOT only licences. A dealer holding nothing at all has no licence
 * document to appear in, and that is the worst case in the whole feature, not
 * an absence worth being quiet about. Those dealers are found by diffing
 * listCustomers() against the licence holders and come back as their own band,
 * `status: 'No licence'`, above the expired ones.
 *
 * Returns { rows, summary, scope }.
 *
 * `scope` is null for a caller who sees the whole company and describes the
 * restriction otherwise, so the screen can say which it is showing. That
 * matters more here than on other screens: a compliance total is read as a
 * total, and an area figure captioned as a company one understates exposure —
 * on this particular report, the wrong kind of wrong.
 *
 * `summary` is computed HERE rather than by a second expirySummary() call from
 * the page, so the cards and the table cannot disagree. They would have: the
 * table is now restricted to the caller's dealers and an independent
 * expirySummary() would still have counted every licence in the company.
 *
 * The licence rows are restricted to the scoped dealers too, not just the
 * override values. listLicences() reads a collection any signed-in user may
 * read in full, so leaving it unfiltered would load fine and quietly mix every
 * area's licences into a table whose 'No licence' rows came from one area.
 */
export async function complianceReport() {
    const [licences, dealers, byKey] = await Promise.all([
        listLicences({ scope: 'dealer' }),
        listCustomers({ status: 'Active' }),
        overriddenLicenceValue(),
    ]);

    const actor = actorScope();
    const restricted = Boolean(actor.areaId || actor.officerId);
    const mine = new Set(dealers.map(d => d.code));

    // `licences` is company-wide even when the dealer list is not — see above.
    const visible = restricted ? licences.filter(l => mine.has(l.holderId)) : licences;
    const covered = new Set(visible.map(l => l.holderId));

    const licenceRows = visible
        .map(l => ({
            ...l,
            valueSoldUnderOverride: byKey.get(`${l.holderId}|${l.licenceType}`) ?? 0,
        }))
        .sort((a, b) => (a.daysRemaining ?? 1e9) - (b.daysRemaining ?? 1e9));

    const uncoveredRows = dealers
        .filter(d => !covered.has(d.code))
        .map(d => ({
            // Synthetic id — there is no licence document behind this row.
            id: `no-licence:${d.code}`,
            scope: 'dealer',
            holderId: d.code,
            holderName: d.name,
            licenceType: null,
            licenceNo: null,
            issuingAuthority: null,
            issueDate: null,
            expiryDate: null,
            status: 'No licence',
            daysRemaining: null,
            valueSoldUnderOverride: dealerTotal(byKey, d.code),
        }))
        // A dealer with no licence who has already been supplied is worse than
        // one who has not, so the money sorts first.
        .sort((a, b) => (b.valueSoldUnderOverride - a.valueSoldUnderOverride)
            || a.holderName.localeCompare(b.holderName));

    return {
        rows: [...uncoveredRows, ...licenceRows],
        summary: countByBand(licenceRows),
        scope: restricted
            ? {
                areaId: actor.areaId ?? null,
                officerId: actor.officerId ?? null,
                dealers: dealers.length,
                label: actor.areaId
                    ? `your area — ${actor.areaId}`
                    : 'the dealers you are responsible for',
            }
            : null,
    };
}
