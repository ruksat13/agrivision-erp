// Feature 1 — dealer licence enforcement.
//
// Selling pesticide, and separately selling fertiliser, requires the buyer to
// hold a valid government licence. Supplying a dealer whose licence has lapsed
// exposes the distributor to penalty, and no general ERP checks it.
//
// This rule refuses the line and states why. An Area Manager may proceed with a
// written reason, which is recorded against the invoice and in the audit log —
// an override that is not logged is not a control.

import { licenceCheckFor } from '../services';

/**
 * @param {import('./checkSaleRules').SaleContext} context
 * @returns {import('./checkSaleRules').RuleResult[]}
 */
export function licenceRule({ licences, lines, saleDate }) {
    return lines
        // licenceCheckFor returns null when the line is permitted, or a result
        // in the shape checkSaleRules expects. It resolves which licence type
        // covers the product's category via LICENCE_FOR_CATEGORY, so packaging
        // and gift lines pass straight through.
        //
        // saleDate, not today: a sale dated before the licence lapsed is lawful
        // and must still save.
        .map(({ product }) => licenceCheckFor(licences, product, saleDate))
        .filter(Boolean);
}
