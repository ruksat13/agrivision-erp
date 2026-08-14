// The point-of-sale rule engine.
//
// One place where every enforcement rule is applied, so that adding Feature 1,
// 2 or 4 is a new file plus one line in the RULES array below — three people
// can write three rules without touching each other's code
// (INTERNAL-PLAN.md §2).
//
// The interface is deliberately a LIST, not a boolean. A boolean cannot say
// which line was refused, why, or whether a manager may override it.

/**
 * @typedef {Object} RuleResult
 * @property {'block'|'warn'} level      block stops the save; warn does not
 * @property {string}  code              e.g. 'LICENCE_EXPIRED' — see RULE_CODE in services/constants
 * @property {?string} productId         the line at fault, or null for an order-level rule
 * @property {string}  message           shown to the user as written
 * @property {boolean} overridable       may an Area Manager proceed anyway?
 *
 * Set by the UI when an override happens — createSale() reads these:
 * @property {boolean} [overridden]
 * @property {string}  [overrideBy]
 * @property {string}  [overrideReason]
 * @property {Date}    [overrideAt]
 */

/**
 * @typedef {Object} SaleContext
 * @property {Object}   customer   the dealer document
 * @property {Array}    licences   that dealer's licences (already loaded)
 * @property {Array}    lines      [{ product, qty, unitPrice, lineTotal }]
 * @property {Date}     saleDate   the date ON THE ORDER, not today
 * @property {Object}   totals     { subTotal, grandTotal, dueAmount }
 */

// ── The registry ──────────────────────────────────────────────────────────
//
// Add a rule here and nowhere else. Each entry is
//   (context) => RuleResult | RuleResult[] | null      (may be async)

import { licenceRule } from './licenceRule';   // Feature 1 — dealer licence
import { bannedRule } from './bannedRule';     // Feature 2 — withdrawn registration

// Still to come:
//
// Feature 4 — expired stock: cut from this submission. Batch.js is a bill of
//   materials and carries no lot identity to hang an expiry date on.
//
// Credit limit: not claimed as a contribution (UNIQUE-FEATURES.md §4) because
//   every ERP has it, but creditLimitCheck() in services/customers.js already
//   returns a RuleResult, so it drops straight in when wanted.

const RULES = [
    licenceRule,
    bannedRule,
];

// ── Running them ──────────────────────────────────────────────────────────

/**
 * Run every registered rule over one order.
 * Always resolves; a rule that throws is reported as a warning rather than
 * taking the screen down with it.
 *
 * @param {SaleContext} context
 * @returns {Promise<RuleResult[]>}
 */
export async function checkSaleRules(context) {
    const results = [];

    for (const rule of RULES) {
        try {
            const out = await rule(context);
            if (out) results.push(...[].concat(out));
        } catch (err) {
            results.push({
                level: 'warn',
                code: 'RULE_ERROR',
                productId: null,
                message: `A rule check could not be completed: ${err.message}`,
                overridable: false,
            });
        }
    }

    // Blocks first, so the reason a save is refused is the first thing read.
    return results.sort((a, b) => (a.level === b.level ? 0 : a.level === 'block' ? -1 : 1));
}

/** How many rules are registered — the screen shows this so an empty engine is visible, not silent. */
export const registeredRuleCount = () => RULES.length;

// ── Helpers for the screen ────────────────────────────────────────────────

export const blocks = (results) => (results || []).filter(r => r.level === 'block');
export const warnings = (results) => (results || []).filter(r => r.level === 'warn');

/** Blocks still standing — a save is refused while any of these remain. */
export const unresolvedBlocks = (results) =>
    blocks(results).filter(r => !r.overridden);

export const canSave = (results) => unresolvedBlocks(results).length === 0;

/** Every result attached to one order line. */
export const resultsForProduct = (results, productId) =>
    (results || []).filter(r => r.productId === productId);

/**
 * Apply an Area Manager's override to one result. Returns a new array; does
 * not mutate. An override without a written reason is refused here as well as
 * in the service layer and in Security Rules — an override that is not
 * recorded is not a control.
 */
export function applyOverride(results, index, { user, reason }) {
    if (!reason || !reason.trim()) {
        throw new Error('An override needs a written reason.');
    }
    const target = results[index];
    if (!target) throw new Error('No such rule result.');
    if (!target.overridable) throw new Error(`${target.code} cannot be overridden.`);

    return results.map((r, i) => (i === index ? {
        ...r,
        overridden: true,
        overrideBy: user?.id ?? null,
        overrideReason: reason.trim(),
        overrideAt: new Date(),
    } : r));
}

export const removeOverride = (results, index) =>
    results.map((r, i) => (i === index
        ? { ...r, overridden: false, overrideBy: undefined, overrideReason: undefined, overrideAt: undefined }
        : r));

/** One-line summary for a header or a toast. */
export function summarise(results) {
    const b = unresolvedBlocks(results).length;
    const o = blocks(results).filter(r => r.overridden).length;
    const w = warnings(results).length;
    if (!results || results.length === 0) return 'No rule issues.';
    const parts = [];
    if (b) parts.push(`${b} blocked`);
    if (o) parts.push(`${o} overridden`);
    if (w) parts.push(`${w} warning${w > 1 ? 's' : ''}`);
    return parts.join(' · ');
}

// ── Writing a rule ────────────────────────────────────────────────────────
//
// A rule is a plain function. It receives the whole context and returns
// nothing, one result, or several. Example — this is Feature 2 in full:
//
//   import { isBannedOn } from '../services';
//
//   export function bannedRule({ lines, saleDate }) {
//       return lines
//           .filter(({ product }) => isBannedOn(product, saleDate))
//           .map(({ product }) => ({
//               level: 'block',
//               code: 'PRODUCT_BANNED',
//               productId: product.code,
//               message: `${product.name} — registration withdrawn from `
//                      + `${product.bannedFrom.toDate().toISOString().slice(0, 10)}. `
//                      + `${product.bannedReason}`,
//               overridable: false,
//           }));
//   }
//
// Then add `bannedRule` to RULES above. That is the whole change.
