// products — schema §4.1
//
// Carries the fields for Feature 2 (banned product) and Feature 3 (Bengali
// safety panel). Both sets are written as null when unknown, never omitted:
// Feature 3 prints a visible "safety data not recorded" marker, and that is
// only distinguishable from a bug if "unknown" was recorded on purpose.

import { COL, PRODUCT_CATEGORY, PRODUCT_TYPE, UNIT, WHO_CLASS, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money, ServiceError,
} from './core';

/** Fields defined by the schema but not yet known. Written as null (§2). */
const NULLABLE_DEFAULTS = {
    brandId: null,
    originId: null,
    buyPrice: null,
    // Feature 2
    bannedFrom: null,
    bannedReason: null,
    bannedAuthority: null,
    // Feature 3
    whoClass: null,
    signalWordBn: null,
    phiDays: null,
    reentryHours: null,
    firstAidBn: null,
    dosageBn: null,
    approvedCropsBn: null,
    // Feature 4 (cut from this submission; field reserved so no migration is needed)
    requiresExpiry: false,
};

// ── Reads ─────────────────────────────────────────────────────────────────

export const getProduct = (code) => getById(COL.PRODUCTS, code);
export const getProductOrThrow = (code) => getByIdOrThrow(COL.PRODUCTS, code);

/**
 * listProducts({ category, type, status, search })
 *
 * `search` is applied in memory over name and code — Firestore has no
 * substring query, and at this catalogue size (a few hundred rows) filtering
 * client-side is both simpler and faster than maintaining a search index.
 */
export async function listProducts({ category, type, status = 'Active', search } = {}) {
    const rows = await listDocs(COL.PRODUCTS, {
        filters: [['category', '==', category], ['type', '==', type], ['status', '==', status]],
        order: ['name', 'asc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(p => p.name.toLowerCase().includes(k) || p.code.toLowerCase().includes(k));
}

/** Options for a <select>. Use this instead of hardcoding a product array. */
export async function productOptions(filter = {}) {
    const rows = await listProducts(filter);
    return rows.map(p => ({ value: p.code, label: `${p.name} [${p.code}]`, product: p }));
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createProduct({ code, name, category, unitId, packSize, packQty, type,
 *                 cartonQty, mrp, ... })
 * The product code becomes the document ID.
 */
export async function createProduct(input) {
    requireFields(input, ['code', 'name', 'category', 'unitId', 'packSize', 'type', 'mrp'], 'createProduct');
    assertEnum(input.category, PRODUCT_CATEGORY, 'category');
    assertEnum(input.type, PRODUCT_TYPE, 'type');
    assertEnum(input.unitId, UNIT, 'unitId');
    if (input.whoClass) assertEnum(input.whoClass, WHO_CLASS, 'whoClass');

    const data = {
        ...NULLABLE_DEFAULTS,
        ...input,
        code: input.code,
        packQty: toNumber(input.packQty ?? 1, 'packQty'),
        cartonQty: toNumber(input.cartonQty ?? 1, 'cartonQty'),
        mrp: money(toNumber(input.mrp, 'mrp')),
        buyPrice: input.buyPrice == null ? null : money(toNumber(input.buyPrice, 'buyPrice')),
        bannedFrom: toTimestamp(input.bannedFrom),
        status: input.status ?? 'Active',
    };
    assertEnum(data.status, STATUS, 'status');
    return createDoc(COL.PRODUCTS, data, { id: input.code });
}

export async function updateProduct(code, patch) {
    if (patch.category) assertEnum(patch.category, PRODUCT_CATEGORY, 'category');
    if (patch.type) assertEnum(patch.type, PRODUCT_TYPE, 'type');
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    if (patch.whoClass) assertEnum(patch.whoClass, WHO_CLASS, 'whoClass');

    const clean = { ...patch };
    if ('mrp' in clean) clean.mrp = money(toNumber(clean.mrp, 'mrp'));
    if ('bannedFrom' in clean) clean.bannedFrom = toTimestamp(clean.bannedFrom);
    return updateDoc_(COL.PRODUCTS, code, clean);
}

export const deactivateProduct = (code, reason) => softDelete(COL.PRODUCTS, code, { reason });

// ── Feature 2 — banned / de-registered products ───────────────────────────

/**
 * Mark a product as withdrawn from a stated date.
 *   banProduct('AI-000730', { from: '2026-07-01', reason: '…', authority: '…' })
 *
 * Note what this does NOT do: it does not deactivate the product. The product
 * stays selectable so that adding it to an order produces a visible refusal.
 * Hiding it from the dropdown would conceal the feature instead of showing it
 * (UNIQUE-FEATURES.md §5, Feature 2).
 */
export async function banProduct(code, { from, reason, authority }) {
    if (!from || !reason) {
        throw new ServiceError('VALIDATION', 'A ban needs an effective date and a reason.');
    }
    return updateProduct(code, {
        bannedFrom: toTimestamp(from),
        bannedReason: reason,
        bannedAuthority: authority ?? null,
    });
}

export const unbanProduct = (code) =>
    updateProduct(code, { bannedFrom: null, bannedReason: null, bannedAuthority: null });

/**
 * Is this product banned as at the given date?
 * Always pass the sale date, never today's — a sale dated before the ban stays
 * valid and must still print.
 */
export function isBannedOn(product, onDate) {
    const from = toDate(product?.bannedFrom);
    if (!from) return false;
    const when = toDate(onDate) ?? new Date();
    return when >= from;
}

export const listBannedProducts = () =>
    listDocs(COL.PRODUCTS, { filters: [['bannedFrom', '!=', null]], order: ['bannedFrom', 'desc'] });

// ── Feature 3 — Bengali safety panel ──────────────────────────────────────

/**
 * setSafetyData('AI-000730', { whoClass, signalWordBn, phiDays,
 *                              reentryHours, firstAidBn, dosageBn, approvedCropsBn })
 */
export async function setSafetyData(code, safety) {
    if (safety.whoClass) assertEnum(safety.whoClass, WHO_CLASS, 'whoClass');
    return updateProduct(code, {
        whoClass: safety.whoClass ?? null,
        signalWordBn: safety.signalWordBn ?? null,
        phiDays: safety.phiDays == null ? null : toNumber(safety.phiDays, 'phiDays'),
        reentryHours: safety.reentryHours == null ? null : toNumber(safety.reentryHours, 'reentryHours'),
        firstAidBn: safety.firstAidBn ?? null,
        dosageBn: safety.dosageBn ?? null,
        approvedCropsBn: safety.approvedCropsBn ?? null,
    });
}

/** True when the product carries enough safety data to print a panel. */
export const hasSafetyData = (p) => Boolean(p && (p.whoClass || p.dosageBn || p.firstAidBn));

/**
 * The subset copied onto each sale line at the moment of sale, so reprinting an
 * old invoice shows what was printed originally. Returns null when there is
 * nothing recorded — the invoice template renders its marker on null.
 */
export function safetySnapshot(product) {
    if (!hasSafetyData(product)) return null;
    return {
        whoClass: product.whoClass ?? null,
        signalWordBn: product.signalWordBn ?? null,
        phiDays: product.phiDays ?? null,
        reentryHours: product.reentryHours ?? null,
        firstAidBn: product.firstAidBn ?? null,
        dosageBn: product.dosageBn ?? null,
    };
}
