// Feature 2 — banned / de-registered product block.
//
// Pesticide registrations are withdrawn and active ingredients banned from a
// stated date. Stock already in the channel must stop moving forward, but
// historic transactions stay valid — a distinction an Active/Inactive flag
// cannot express, because deactivating the product hides it retrospectively
// and breaks old invoices.
//
// Two decisions worth stating, both from UNIQUE-FEATURES.md §5:
//
//   1. NOT OVERRIDABLE. A lapsed licence is an administrative problem a manager
//      can take responsibility for; a withdrawn registration is a legal
//      prohibition, and no one in the company can authorise it.
//
//   2. The comparison is against the SALE DATE, never today. A sale dated
//      before bannedFrom remains valid and must still print. That
//      date-effective behaviour is the whole point of the feature.

import { isBannedOn, formatDate } from '../services';

const asDay = (v) => formatDate(v) || 'an unstated date';

/**
 * @param {import('./checkSaleRules').SaleContext} context
 * @returns {import('./checkSaleRules').RuleResult[]}
 */
export function bannedRule({ lines, saleDate }) {
    return lines
        .filter(({ product }) => isBannedOn(product, saleDate))
        .map(({ product }) => ({
            level: 'block',
            code: 'PRODUCT_BANNED',
            productId: product.code,
            message: `${product.name} — registration withdrawn with effect from `
                + `${asDay(product.bannedFrom)}. ${product.bannedReason || ''}`
                + (product.bannedAuthority ? ` (${product.bannedAuthority})` : ''),
            // A legal prohibition is not a manager's to waive.
            overridable: false,
        }));
}
