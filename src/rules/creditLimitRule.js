// Credit limit — the dealer's own exposure.
//
// Not claimed as a contribution (UNIQUE-FEATURES.md §4): every ERP has a credit
// limit. It is registered here because the engine is where an enforcement rule
// belongs, and because a limit that lives only in a report is not a control.
//
// The arithmetic is creditLimitCheck() in services/customers.js, which already
// returns a RuleResult. This file is the registration and the two decisions
// behind it.
//
//   1. BLOCK, not warn. A warning does not gate the save, and only a block
//      produces a rule_override entry (createSale filters ruleChecks on
//      `overridden`). Warn the limit and the invoice posts, the balance moves
//      and the extra exposure is on the books before anyone has read the
//      message — nobody's name against it, no reason recorded. A credit limit
//      exists to force a decision, so it has to stop the save to get one.
//
//   2. OVERRIDABLE. The licence block is overridable because a lapsed licence
//      is an administrative failure someone can take responsibility for; the
//      ban is not because it is a legal prohibition nobody in the company can
//      authorise. A credit limit is neither. It is a commercial threshold the
//      company set over its own money, and the company can therefore lift it —
//      exceeding one is not an error to be corrected but a risk to be accepted,
//      and refusing it outright would only push the sale off the system.
//      What matters is who accepts it: OVERRIDE_ROLES excludes the Sales
//      Officer (CLAUDE.md §5), so the officer who books the sale cannot extend
//      the credit behind it, and the Area Manager carrying the receivable is
//      the one who signs — with a written reason, in the audit log.
//
// Against dueAmount, not grandTotal. The balance moves by the unpaid part
// (sales.js:277) — a cash sale settled in full adds no exposure and must not
// be refused because of a balance it does not touch.

import { creditLimitCheck } from '../services';

/**
 * @param {import('./checkSaleRules').SaleContext} context
 * @returns {?import('./checkSaleRules').RuleResult}   order-level: productId is null
 */
export function creditLimitRule({ customer, totals }) {
    return creditLimitCheck(customer, totals?.dueAmount ?? 0);
}
